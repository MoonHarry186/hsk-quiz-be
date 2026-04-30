const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    hskLevel: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5, 6],
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    duration: {
      type: Number,
      default: 30,
      min: 5,
      max: 180,
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    generatedByAI: {
      type: Boolean,
      default: false,
    },
    aiGeneratedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

quizSchema.index({ hskLevel: 1, isPublished: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Quiz', quizSchema);
