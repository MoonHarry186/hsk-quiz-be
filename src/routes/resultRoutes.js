const router = require('express').Router();
const { getResult } = require('../controllers/resultController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/:attemptId', authenticate, getResult);

module.exports = router;
