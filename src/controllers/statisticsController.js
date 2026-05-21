const UserStatistics = require('../models/UserStatistics');
const Attempt = require('../models/Attempt');
const { NotFoundError } = require('../utils/errors');
const { successResponse } = require('../utils/helpers');

const getStatistics = async (req, res, next) => {
  try {
    const { period } = req.query; // 'day', 'week', 'month', 'year'
    let stats;

    if (period && period !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (period.toLowerCase()) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      const attempts = await Attempt.find({
        userId: req.user._id,
        submittedAt: { $gte: startDate },
        status: { $in: ['submitted', 'graded'] },
      });

      const totalAttempts = attempts.length;
      const totalPassedQuizzes = attempts.filter((a) => a.passedStatus).length;
      const totalScore = attempts.reduce((acc, a) => acc + (a.totalScore || 0), 0);
      const totalStudyTime = attempts.reduce((acc, a) => acc + (a.summary?.timeSpentSeconds || 0), 0);

      // Get persistent stats for non-period fields
      const overallStats = await UserStatistics.findOne({ userId: req.user._id });

      stats = {
        userId: req.user._id,
        totalAttempts,
        totalPassedQuizzes,
        averageScore: totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 10) / 10 : 0,
        totalStudyTime,
        levelStatistics: overallStats?.levelStatistics || [],
        questionTypeStats: overallStats?.questionTypeStats || [],
        currentStreak: overallStats?.currentStreak || 0,
        longestStreak: overallStats?.longestStreak || 0,
        lastActivityDate: overallStats?.lastActivityDate || null,
        targetLevel: overallStats?.targetLevel || 3,
        progressPercentage: overallStats?.progressPercentage || 0,
      };
    }

    // Fallback to overall stats if no period was requested
    if (!stats) {
      stats = await UserStatistics.findOne({ userId: req.user._id });
    }

    if (!stats) {
      stats = {
        userId: req.user._id,
        totalAttempts: 0,
        totalPassedQuizzes: 0,
        averageScore: 0,
        totalStudyTime: 0,
        levelStatistics: [],
        questionTypeStats: [],
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        achievements: [],
        targetLevel: 3,
        progressPercentage: 0,
      };
    }

    return successResponse(res, { statistics: stats }, 'Statistics retrieved');
  } catch (err) {
    next(err);
  }
};

const getComparison = async (req, res, next) => {
  try {
    const userStats = await UserStatistics.findOne({ userId: req.user._id });

    const globalAgg = await UserStatistics.aggregate([
      {
        $group: {
          _id: null,
          globalAverageScore: { $avg: '$averageScore' },
          globalTotalAttempts: { $avg: '$totalAttempts' },
          globalPassRate: {
            $avg: {
              $cond: [
                { $gt: ['$totalAttempts', 0] },
                { $divide: ['$totalPassedQuizzes', '$totalAttempts'] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const global = globalAgg[0] || {
      globalAverageScore: 0,
      globalTotalAttempts: 0,
      globalPassRate: 0,
    };

    const userPassRate =
      userStats && userStats.totalAttempts > 0
        ? userStats.totalPassedQuizzes / userStats.totalAttempts
        : 0;

    return successResponse(
      res,
      {
        user: {
          averageScore: userStats ? userStats.averageScore : 0,
          totalAttempts: userStats ? userStats.totalAttempts : 0,
          passRate: Math.round(userPassRate * 100),
        },
        global: {
          averageScore: Math.round(global.globalAverageScore || 0),
          totalAttempts: Math.round(global.globalTotalAttempts || 0),
          passRate: Math.round((global.globalPassRate || 0) * 100),
        },
      },
      'Comparison retrieved'
    );
  } catch (err) {
    next(err);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await UserStatistics.find({ totalAttempts: { $gt: 0 } })
      .sort({ averageScore: -1 })
      .limit(10)
      .populate('userId', 'username fullName hskLevel');

    return successResponse(
      res,
      {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          user: entry.userId,
          averageScore: entry.averageScore,
          totalAttempts: entry.totalAttempts,
          totalPassedQuizzes: entry.totalPassedQuizzes,
          currentStreak: entry.currentStreak,
        })),
      },
      'Leaderboard retrieved'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getStatistics, getComparison, getLeaderboard };
