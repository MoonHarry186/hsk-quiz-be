const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const { NotFoundError } = require('../utils/errors');
const { successResponse } = require('../utils/helpers');

const createQuestion = async (req, res, next) => {
  try {
    const { quizId, content, questionType, hskLevel, multipleChoice, fillBlank, explanation, points, topics, difficulty } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    const question = await Question.create({
      quizId,
      content,
      questionType,
      hskLevel,
      multipleChoice,
      fillBlank,
      explanation,
      points,
      topics,
      difficulty,
    });

    if (!quiz.questionIds.includes(question._id)) {
      quiz.questionIds.push(question._id);
      quiz.totalQuestions = quiz.questionIds.length;
      await quiz.save();
    }

    return successResponse(res, { question }, 'Question created', 201);
  } catch (err) {
    next(err);
  }
};

const getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) throw new NotFoundError('Question not found');
    return successResponse(res, { question }, 'Question retrieved');
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.questionId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!question) throw new NotFoundError('Question not found');
    return successResponse(res, { question }, 'Question updated');
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) throw new NotFoundError('Question not found');

    await Quiz.findByIdAndUpdate(question.quizId, {
      $pull: { questionIds: question._id },
      $inc: { totalQuestions: -1 },
    });

    await question.deleteOne();
    return successResponse(res, null, 'Question deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { createQuestion, getQuestion, updateQuestion, deleteQuestion };
