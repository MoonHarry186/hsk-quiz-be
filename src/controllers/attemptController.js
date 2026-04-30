const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');
const { gradeAttempt, buildAnalysis } = require('../services/gradingService');
const { updateStatistics } = require('../services/statisticsService');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const { successResponse, paginate, buildPaginatedResponse } = require('../utils/helpers');

const startAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');
    if (!quiz.isPublished) throw new ForbiddenError('Quiz is not published');

    const existingAttempt = await Attempt.findOne({
      userId: req.user._id,
      quizId: quiz._id,
      status: 'in_progress',
    });

    if (existingAttempt) {
      return successResponse(res, { attempt: existingAttempt }, 'Existing attempt resumed');
    }

    const attempt = await Attempt.create({
      userId: req.user._id,
      quizId: quiz._id,
      startedAt: new Date(),
      status: 'in_progress',
      answers: [],
    });

    return successResponse(res, { attempt }, 'Attempt started', 201);
  } catch (err) {
    next(err);
  }
};

const submitAnswer = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');
    if (attempt.userId.toString() !== req.user._id.toString()) throw new ForbiddenError();
    if (attempt.status !== 'in_progress') throw new ValidationError('Attempt is already submitted');

    const { questionId, userAnswer, timeSpent } = req.body;

    const question = await Question.findById(questionId);
    if (!question) throw new NotFoundError('Question not found');

    const existingIndex = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId
    );

    const answerData = {
      questionId,
      userAnswer,
      timeSpent: timeSpent || 0,
      submittedAt: new Date(),
    };

    if (existingIndex >= 0) {
      attempt.answers[existingIndex] = { ...attempt.answers[existingIndex], ...answerData };
    } else {
      attempt.answers.push(answerData);
    }

    await attempt.save();
    return successResponse(res, { attempt }, 'Answer saved');
  } catch (err) {
    next(err);
  }
};

const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');
    if (attempt.userId.toString() !== req.user._id.toString()) throw new ForbiddenError();
    if (attempt.status !== 'in_progress') throw new ValidationError('Attempt is already submitted');

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    const questions = await Question.find({ quizId: quiz._id });

    const submittedAt = new Date();
    const timeSpentSeconds = Math.round((submittedAt - attempt.startedAt) / 1000);

    const { gradedAnswers, totalScore, percentage, passed, correctAnswers, wrongAnswers } =
      gradeAttempt(questions, attempt.answers, quiz);

    attempt.answers = gradedAnswers;
    attempt.totalScore = totalScore;
    attempt.passedStatus = passed;
    attempt.status = 'graded';
    attempt.submittedAt = submittedAt;
    attempt.summary = {
      totalQuestions: questions.length,
      answeredQuestions: attempt.answers.length,
      correctAnswers,
      wrongAnswers,
      percentage,
      timeSpentSeconds,
    };

    await attempt.save();

    await Quiz.findByIdAndUpdate(quiz._id, {
      $inc: { totalAttempts: 1 },
      $set: {
        averageScore: await computeNewAverage(quiz._id, percentage),
      },
    });

    const analysis = buildAnalysis(questions, gradedAnswers);

    const resultAnswers = gradedAnswers.map((answer) => {
      const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
      return {
        questionId: answer.questionId,
        questionContent: question ? question.content : '',
        questionType: question ? question.questionType : '',
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        explanation: answer.explanation,
        timeSpent: answer.timeSpent,
      };
    });

    const result = await Result.create({
      attemptId: attempt._id,
      userId: req.user._id,
      quizId: quiz._id,
      score: totalScore,
      percentage,
      passed,
      timeSpent: timeSpentSeconds,
      correctAnswers,
      wrongAnswers,
      analysis,
      answers: resultAnswers,
    });

    await updateStatistics(req.user._id, { ...result.toObject(), answers: resultAnswers }, quiz);

    return successResponse(res, { attempt, result }, 'Quiz submitted and graded');
  } catch (err) {
    next(err);
  }
};

const computeNewAverage = async (quizId, newScore) => {
  const Quiz = require('../models/Quiz');
  const quiz = await Quiz.findById(quizId);
  if (!quiz) return newScore;
  const totalAttempts = quiz.totalAttempts + 1;
  return Math.round((quiz.averageScore * quiz.totalAttempts + newScore) / totalAttempts);
};

const getAttempt = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('quizId', 'title hskLevel')
      .populate('answers.questionId', 'content questionType');

    if (!attempt) throw new NotFoundError('Attempt not found');

    const isOwner = attempt.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) throw new ForbiddenError();

    return successResponse(res, { attempt }, 'Attempt retrieved');
  } catch (err) {
    next(err);
  }
};

const listAttempts = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [attempts, total] = await Promise.all([
      Attempt.find(filter)
        .populate('quizId', 'title hskLevel')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Attempt.countDocuments(filter),
    ]);

    return successResponse(
      res,
      buildPaginatedResponse(attempts, total, page, limit),
      'Attempts retrieved'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { startAttempt, submitAnswer, submitAttempt, getAttempt, listAttempts };
