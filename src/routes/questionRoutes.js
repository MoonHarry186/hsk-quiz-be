const router = require('express').Router();
const {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  listQuestions,
} = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validate, createQuestionSchema } = require('../utils/validators');

router.get('/', authenticate, authorize('admin', 'teacher'), listQuestions);
router.post('/', authenticate, authorize('admin', 'teacher'), validate(createQuestionSchema), createQuestion);
router.get('/:questionId', authenticate, authorize('admin', 'teacher'), getQuestion);
router.put('/:questionId', authenticate, authorize('admin', 'teacher'), updateQuestion);
router.delete('/:questionId', authenticate, authorize('admin', 'teacher'), deleteQuestion);

module.exports = router;
