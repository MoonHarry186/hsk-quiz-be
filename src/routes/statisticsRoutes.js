const router = require('express').Router();
const {
  getStatistics,
  getComparison,
  getLeaderboard,
} = require('../controllers/statisticsController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getStatistics);
router.get('/comparison', authenticate, getComparison);
router.get('/leaderboard', authenticate, getLeaderboard);

module.exports = router;
