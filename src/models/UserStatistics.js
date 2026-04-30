const mongoose = require('mongoose');

const levelStatSchema = new mongoose.Schema(
  {
    level: Number,
    attempts: { type: Number, default: 0 },
    passed: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    lastAttempt: Date,
    bestScore: { type: Number, default: 0 },
    worstScore: { type: Number, default: 100 },
  },
  { _id: false }
);

const questionTypeStatSchema = new mongoose.Schema(
  {
    type: String,
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  {
    name: String,
    unlockedAt: Date,
  },
  { _id: false }
);

const userStatisticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalAttempts: { type: Number, default: 0 },
    totalPassedQuizzes: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    levelStatistics: [levelStatSchema],
    questionTypeStats: [questionTypeStatSchema],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: Date,
    achievements: [achievementSchema],
    targetLevel: { type: Number, default: 3 },
    progressPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserStatistics', userStatisticsSchema);
