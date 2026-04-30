const mongoose = require('mongoose');

const resultAnswerSchema = new mongoose.Schema(
  {
    questionId: mongoose.Schema.Types.ObjectId,
    questionContent: String,
    questionType: String,
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    pointsEarned: Number,
    explanation: String,
    timeSpent: Number,
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    timeSpent: Number,
    correctAnswers: Number,
    wrongAnswers: Number,
    analysis: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      byQuestionType: [
        {
          type: String,
          correct: Number,
          total: Number,
          percentage: Number,
          _id: false,
        },
      ],
    },
    answers: [resultAnswerSchema],
  },
  { timestamps: true }
);

resultSchema.index({ userId: 1, quizId: 1 });

module.exports = mongoose.model('Result', resultSchema);
