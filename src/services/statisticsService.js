const UserStatistics = require('../models/UserStatistics');

const updateStatistics = async (userId, result, quiz) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await UserStatistics.findOne({ userId });

  if (!stats) {
    const levelStat = {
      level: quiz.hskLevel,
      attempts: 1,
      passed: result.passed ? 1 : 0,
      averageScore: result.percentage,
      lastAttempt: new Date(),
      bestScore: result.percentage,
      worstScore: result.percentage,
    };

    const questionTypeStats = buildQuestionTypeStats([], result.answers);

    await UserStatistics.create({
      userId,
      totalAttempts: 1,
      totalPassedQuizzes: result.passed ? 1 : 0,
      averageScore: result.percentage,
      totalStudyTime: result.timeSpent || 0,
      levelStatistics: [levelStat],
      questionTypeStats,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: new Date(),
    });

    return;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = stats.currentStreak || 0;
  const lastActivity = stats.lastActivityDate
    ? new Date(stats.lastActivityDate)
    : null;

  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate.getTime() === yesterday.getTime()) {
      currentStreak += 1;
    } else if (lastDate.getTime() < yesterday.getTime()) {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(currentStreak, stats.longestStreak || 0);

  const totalAttempts = stats.totalAttempts + 1;
  const totalPassedQuizzes = stats.totalPassedQuizzes + (result.passed ? 1 : 0);
  const averageScore = Math.round(
    (stats.averageScore * stats.totalAttempts + result.percentage) / totalAttempts
  );
  const totalStudyTime = stats.totalStudyTime + (result.timeSpent || 0);

  const levelStatistics = updateLevelStatistics(
    stats.levelStatistics || [],
    quiz.hskLevel,
    result
  );

  const questionTypeStats = buildQuestionTypeStats(
    stats.questionTypeStats || [],
    result.answers
  );

  const progressPercentage = calculateProgress(levelStatistics, stats.targetLevel || 3);

  await UserStatistics.findOneAndUpdate(
    { userId },
    {
      $set: {
        totalAttempts,
        totalPassedQuizzes,
        averageScore,
        totalStudyTime,
        levelStatistics,
        questionTypeStats,
        currentStreak,
        longestStreak,
        lastActivityDate: new Date(),
        progressPercentage,
      },
    },
    { new: true }
  );
};

const updateLevelStatistics = (levelStats, hskLevel, result) => {
  const existing = levelStats.find((ls) => ls.level === hskLevel);

  if (existing) {
    const newAttempts = existing.attempts + 1;
    return levelStats.map((ls) => {
      if (ls.level !== hskLevel) return ls;
      return {
        ...ls,
        attempts: newAttempts,
        passed: ls.passed + (result.passed ? 1 : 0),
        averageScore: Math.round(
          (ls.averageScore * ls.attempts + result.percentage) / newAttempts
        ),
        lastAttempt: new Date(),
        bestScore: Math.max(ls.bestScore, result.percentage),
        worstScore: Math.min(ls.worstScore, result.percentage),
      };
    });
  }

  return [
    ...levelStats,
    {
      level: hskLevel,
      attempts: 1,
      passed: result.passed ? 1 : 0,
      averageScore: result.percentage,
      lastAttempt: new Date(),
      bestScore: result.percentage,
      worstScore: result.percentage,
    },
  ];
};

const buildQuestionTypeStats = (existing, answers) => {
  const typeMap = {};
  (existing || []).forEach((stat) => {
    typeMap[stat.type] = { correct: stat.correct, total: stat.total };
  });

  (answers || []).forEach((answer) => {
    const type = answer.questionType;
    if (!type) return;
    if (!typeMap[type]) typeMap[type] = { correct: 0, total: 0 };
    typeMap[type].total += 1;
    if (answer.isCorrect) typeMap[type].correct += 1;
  });

  return Object.entries(typeMap).map(([type, stats]) => ({
    type,
    correct: stats.correct,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));
};

const calculateProgress = (levelStatistics, targetLevel) => {
  const targetStat = levelStatistics.find((ls) => ls.level === targetLevel);
  if (!targetStat) return 0;
  return Math.min(100, Math.round((targetStat.averageScore / 100) * 100));
};

module.exports = { updateStatistics };
