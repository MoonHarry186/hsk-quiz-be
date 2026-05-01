const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const { generateQuestions } = require('../services/aiService');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { successResponse, paginate, buildPaginatedResponse, stripAnswers } = require('../utils/helpers');

const listQuizzes = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { hskLevel, search, generatedByAI } = req.query;

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    const filter = isAdmin ? {} : { isPublished: true };
    if (hskLevel) filter.hskLevel = Number(hskLevel);
    if (generatedByAI !== undefined) filter.generatedByAI = generatedByAI === 'true';
    if (search) filter.$text = { $search: search };

    const [quizzes, total, userAttempts] = await Promise.all([
      Quiz.find(filter)
        .populate('createdBy', 'username fullName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Quiz.countDocuments(filter),
      req.user ? Attempt.find({ userId: req.user._id }).select('quizId') : [],
    ]);

    const attemptMap = userAttempts.reduce((acc, curr) => {
      acc[curr.quizId.toString()] = (acc[curr.quizId.toString()] || 0) + 1;
      return acc;
    }, {});

    const quizzesWithAttempts = quizzes.map((quiz) => {
      const plainQuiz = quiz.toObject();
      plainQuiz.userAttemptsCount = attemptMap[quiz._id.toString()] || 0;
      return plainQuiz;
    });

    return successResponse(
      res,
      buildPaginatedResponse(quizzesWithAttempts, total, page, limit),
      'Quizzes retrieved'
    );
  } catch (err) {
    next(err);
  }
};

const generateQuiz = async (req, res, next) => {
  try {
    const { title, description, hskLevel, numberOfQuestions, duration, passingScore, topics, questionTypes } = req.body;

    const aiQuestions = await generateQuestions({
      hskLevel,
      numberOfQuestions,
      topics,
      questionTypes,
    });

    const quiz = await Quiz.create({
      title,
      description,
      hskLevel,
      totalQuestions: aiQuestions.length,
      duration,
      passingScore,
      generatedByAI: true,
      aiGeneratedAt: new Date(),
      createdBy: req.user._id,
    });

    const questions = await Question.insertMany(
      aiQuestions.map((q) => ({ ...q, quizId: quiz._id }))
    );

    quiz.questionIds = questions.map((q) => q._id);
    await quiz.save();

    return successResponse(
      res,
      { quiz, questions },
      'Quiz generated successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

const createQuiz = async (req, res, next) => {
  try {
    const { title, description, hskLevel, totalQuestions, duration, passingScore, questionIds, isPublished } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      hskLevel,
      totalQuestions,
      duration,
      passingScore,
      questionIds: questionIds || [],
      isPublished,
      createdBy: req.user._id,
    });

    return successResponse(res, { quiz }, 'Quiz created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).populate('createdBy', 'username fullName');
    if (!quiz) throw new NotFoundError('Quiz not found');

    const questions = await Question.find({ quizId: quiz._id });
    const safeQuestions = questions.map(stripAnswers);

    return successResponse(res, { quiz, questions: safeQuestions }, 'Quiz retrieved');
  } catch (err) {
    next(err);
  }
};

const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    const isAdmin = req.user.role === 'admin';
    const isOwner = quiz.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) throw new ForbiddenError();

    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.quizId, req.body, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, { quiz: updatedQuiz }, 'Quiz updated');
  } catch (err) {
    next(err);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    await Question.deleteMany({ quizId: quiz._id });
    await quiz.deleteOne();

    return successResponse(res, null, 'Quiz deleted');
  } catch (err) {
    next(err);
  }
};

const submitQuiz = async (req, res, next) => {
  try {
    const { quizId, answers } = req.body; // answers: [{ questionId, userAnswer }]
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    const questions = await Question.find({ quizId: quiz._id });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let correctAnswersCount = 0;
    const processedAnswers = answers.map((ans) => {
      const question = questionMap.get(ans.questionId);
      if (!question) return { ...ans, isCorrect: false };

      let isCorrect = false;
      let correctAnswerText = '';

      if (question.questionType === 'multiple_choice') {
        isCorrect = question.multipleChoice.correctAnswer === ans.userAnswer;
        correctAnswerText = question.multipleChoice.options[question.multipleChoice.correctAnswer];
      } else if (question.questionType === 'fill_blank') {
        // Simple string comparison for now
        isCorrect = question.fillBlank.blanks[0].toLowerCase().trim() === ans.userAnswer.toLowerCase().trim();
        correctAnswerText = question.fillBlank.blanks[0];
      }

      if (isCorrect) correctAnswersCount++;

      return {
        questionId: question._id,
        userAnswer: ans.userAnswer,
        isCorrect,
        correctAnswer: correctAnswerText,
        explanation: question.explanation,
        pointsEarned: isCorrect ? question.points : 0,
      };
    });

    const totalScore = processedAnswers.reduce((sum, ans) => sum + ans.pointsEarned, 0);
    const passedStatus = totalScore >= quiz.passingScore;

    const attempt = await Attempt.create({
      userId: req.user._id,
      quizId: quiz._id,
      submittedAt: new Date(),
      totalScore,
      passedStatus,
      status: 'submitted',
      answers: processedAnswers,
      summary: {
        totalQuestions: questions.length,
        answeredQuestions: answers.length,
        correctAnswers: correctAnswersCount,
        wrongAnswers: questions.length - correctAnswersCount,
        percentage: (correctAnswersCount / questions.length) * 100,
      },
    });

    // Update quiz stats
    quiz.totalAttempts += 1;
    quiz.averageScore = (quiz.averageScore * (quiz.totalAttempts - 1) + totalScore) / quiz.totalAttempts;
    await quiz.save();

    return successResponse(res, { attempt }, 'Quiz submitted successfully');
  } catch (err) {
    next(err);
  }
};

const getAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.query;
    const filter = { userId: req.user._id };
    if (quizId) filter.quizId = quizId;

    const attempts = await Attempt.find(filter)
      .populate('quizId', 'title hskLevel')
      .sort({ createdAt: -1 });

    return successResponse(res, attempts, 'Attempts retrieved');
  } catch (err) {
    next(err);
  }
};

const getAttempt = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('quizId', 'title hskLevel')
      .populate('answers.questionId');
    if (!attempt) throw new NotFoundError('Attempt not found');

    if (attempt.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to view this attempt');
    }

    return successResponse(res, attempt, 'Attempt retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listQuizzes,
  generateQuiz,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getAttempts,
  getAttempt,
};
