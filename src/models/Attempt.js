const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    userAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    pointsEarned: Number,
    timeSpent: Number,
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    submittedAt: Date,
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
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
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: Date,
    totalScore: Number,
    passedStatus: Boolean,
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded'],
      default: 'in_progress',
    },
    answers: [answerSchema],
    summary: {
      totalQuestions: Number,
      answeredQuestions: Number,
      correctAnswers: Number,
      wrongAnswers: Number,
      percentage: Number,
      timeSpentSeconds: Number,
    },
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, quizId: 1 });
attemptSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
