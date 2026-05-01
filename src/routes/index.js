const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/quizzes', require('./quizRoutes'));
router.use('/questions', require('./questionRoutes'));
router.use('/attempts', require('./attemptRoutes'));
router.use('/results', require('./resultRoutes'));
router.use('/statistics', require('./statisticsRoutes'));
router.use('/users', require('./userRoutes'));

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'HSK Quiz API is running', data: { status: 'healthy' } });
});

module.exports = router;
