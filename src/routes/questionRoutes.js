const router = require('express').Router();
const {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validate, createQuestionSchema } = require('../utils/validators');

router.post('/', authenticate, authorize('admin', 'teacher'), validate(createQuestionSchema), createQuestion);
router.get('/:questionId', authenticate, authorize('admin', 'teacher'), getQuestion);
router.put('/:questionId', authenticate, authorize('admin', 'teacher'), updateQuestion);
router.delete('/:questionId', authenticate, authorize('admin', 'teacher'), deleteQuestion);

module.exports = router;
