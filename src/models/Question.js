const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'fill_blank', 'essay'],
      required: true,
    },
    hskLevel: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5, 6],
    },
    multipleChoice: {
      options: [String],
      correctAnswer: Number,
    },
    fillBlank: {
      blanks: [String],
      sentences: [String],
      hints: [String],
    },
    explanation: {
      type: String,
      maxlength: 2000,
    },
    points: {
      type: Number,
      default: 1,
      min: 0.5,
      max: 10,
    },
    topics: [String],
    difficulty: String,
  },
  { timestamps: true }
);

questionSchema.index({ quizId: 1 });
questionSchema.index({ hskLevel: 1, questionType: 1 });

module.exports = mongoose.model('Question', questionSchema);
