const router = require('express').Router();
const {
  startAttempt,
  submitAnswer,
  submitAttempt,
  getAttempt,
  listAttempts,
} = require('../controllers/attemptController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, submitAnswerSchema } = require('../utils/validators');

router.post('/start/:quizId', authenticate, startAttempt);
router.post('/:attemptId/submit-answer', authenticate, validate(submitAnswerSchema), submitAnswer);
router.post('/:attemptId/submit', authenticate, submitAttempt);
router.get('/', authenticate, listAttempts);
router.get('/:attemptId', authenticate, getAttempt);

module.exports = router;
