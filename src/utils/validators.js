const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  username: Joi.string().trim().min(3).max(30).required(),
  fullName: Joi.string().trim().optional(),
  hskLevel: Joi.number().valid(1, 2, 3, 4, 5, 6).default(1),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).optional(),
  fullName: Joi.string().trim().optional(),
  hskLevel: Joi.number().valid(1, 2, 3, 4, 5, 6).optional(),
});

const createQuizSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(1000).optional(),
  hskLevel: Joi.number().valid(1, 2, 3, 4, 5, 6).required(),
  totalQuestions: Joi.number().min(1).max(100).required(),
  duration: Joi.number().min(5).max(180).default(30),
  passingScore: Joi.number().min(0).max(100).default(70),
  questionIds: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().default(true),
});

const generateQuizSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(1000).optional(),
  hskLevel: Joi.number().valid(1, 2, 3, 4, 5, 6).required(),
  numberOfQuestions: Joi.number().min(1).max(50).default(10),
  duration: Joi.number().min(5).max(180).default(30),
  passingScore: Joi.number().min(0).max(100).default(70),
  topics: Joi.array().items(Joi.string()).optional(),
  questionTypes: Joi.array()
    .items(Joi.string().valid('multiple_choice', 'fill_blank', 'essay'))
    .default(['multiple_choice']),
});

const createQuestionSchema = Joi.object({
  quizId: Joi.string().required(),
  content: Joi.string().max(1000).required(),
  questionType: Joi.string().valid('multiple_choice', 'fill_blank', 'essay').required(),
  hskLevel: Joi.number().valid(1, 2, 3, 4, 5, 6).required(),
  multipleChoice: Joi.when('questionType', {
    is: 'multiple_choice',
    then: Joi.object({
      options: Joi.array().items(Joi.string()).min(2).required(),
      correctAnswer: Joi.number().min(0).required(),
    }).required(),
    otherwise: Joi.optional(),
  }),
  fillBlank: Joi.when('questionType', {
    is: 'fill_blank',
    then: Joi.object({
      blanks: Joi.array().items(Joi.string()).min(1).required(),
      sentences: Joi.array().items(Joi.string()).optional(),
      hints: Joi.array().items(Joi.string()).optional(),
    }).required(),
    otherwise: Joi.optional(),
  }),
  explanation: Joi.string().max(2000).optional(),
  points: Joi.number().min(0.5).max(10).default(1),
  topics: Joi.array().items(Joi.string()).optional(),
  difficulty: Joi.string().optional(),
});

const submitAnswerSchema = Joi.object({
  questionId: Joi.string().required(),
  userAnswer: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.array()).required(),
  timeSpent: Joi.number().min(0).optional(),
});

const submitQuizSchema = Joi.object({
  quizId: Joi.string().required(),
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required(),
        userAnswer: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.array()).required(),
      })
    )
    .default([]),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
      data: null,
    });
  }
  req.body = value;
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createQuizSchema,
  generateQuizSchema,
  createQuestionSchema,
  submitAnswerSchema,
  submitQuizSchema,
};
