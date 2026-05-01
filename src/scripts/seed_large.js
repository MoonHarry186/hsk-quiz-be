const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connect } = require("../config/database");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const UserStatistics = require("../models/UserStatistics");
const logger = require("../utils/logger");

dotenv.config();

const TARGET_USER_EMAIL = "phuc@gmail.com";

const seedLargeData = async () => {
  try {
    await connect();
    logger.info("Connected to database for large seeding...");

    // 1. Clear existing data
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await Attempt.deleteMany({});
    await UserStatistics.deleteMany({});
    logger.info(
      "Cleared existing quizzes, questions, attempts, and statistics.",
    );

    // 2. Find target user
    const user = await User.findOne({ email: TARGET_USER_EMAIL });
    if (!user) {
      logger.error(`Target user ${TARGET_USER_EMAIL} not found!`);
      process.exit(1);
    }
    const admin = (await User.findOne({ role: "superadmin" })) || user;

    const topics = [
      "Daily Life",
      "Work",
      "Travel",
      "Education",
      "Food",
      "Hobbies",
      "Business",
      "Health",
      "Culture",
      "Shopping",
    ];
    const questionTypes = ["multiple_choice", "matching", "fill_in_blank"];

    // 3. Create 50 Quizzes
    logger.info("Creating 50 quizzes...");
    const quizzes = [];
    for (let i = 1; i <= 50; i++) {
      const level = (i % 6) + 1;
      quizzes.push({
        title: `HSK ${level} Test #${i}`,
        description: `Practice test #${i} for HSK Level ${level} with 10 questions.`,
        hskLevel: level,
        totalQuestions: 10,
        duration: 20,
        passingScore: 6,
        generatedByAI: false,
        createdBy: admin._id,
        isPublished: true,
      });
    }
    const insertedQuizzes = await Quiz.insertMany(quizzes);
    logger.info("Inserted 50 quizzes.");

    // 4. Create 500 Questions (10 per quiz)
    logger.info("Creating 500 unique questions...");
    const allQuestions = [];
    for (let i = 0; i < insertedQuizzes.length; i++) {
      const quiz = insertedQuizzes[i];
      const quizQuestions = [];
      for (let j = 1; j <= 10; j++) {
        allQuestions.push({
          quizId: quiz._id,
          content: `Question ${j} for ${quiz.title}: What is the correct translation of this phrase?`,
          questionType: "multiple_choice",
          hskLevel: quiz.hskLevel,
          explanation: `Detailed explanation for question ${j} in quiz ${i + 1}.`,
          points: 1,
          topics: [topics[j % topics.length]],
          difficulty: j <= 3 ? "easy" : j <= 7 ? "medium" : "hard",
          multipleChoice: {
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: Math.floor(Math.random() * 4),
          },
        });
      }
    }
    const insertedQuestions = await Question.insertMany(allQuestions);

    // Link questions back to quizzes
    for (let i = 0; i < insertedQuizzes.length; i++) {
      const quiz = insertedQuizzes[i];
      const startIdx = i * 10;
      quiz.questionIds = insertedQuestions
        .slice(startIdx, startIdx + 10)
        .map((q) => q._id);
      await quiz.save();
    }
    logger.info("Inserted 500 questions and linked to 50 quizzes.");

    // 5. Create 1000 Attempts for target user
    logger.info(`Creating 1000 attempts for user ${TARGET_USER_EMAIL}...`);
    const attempts = [];
    let totalScoreAll = 0;
    let totalStudyTime = 0;
    let passedCount = 0;

    for (let i = 1; i <= 1000; i++) {
      const quiz = insertedQuizzes[i % 50];
      const score = Math.floor(Math.random() * 11); // 0-10
      const passed = score >= quiz.passingScore;
      const timeSpent = Math.floor(Math.random() * 600) + 300; // 5-15 mins

      totalScoreAll += score;
      totalStudyTime += timeSpent;
      if (passed) passedCount++;

      const date = new Date();
      date.setDate(date.getDate() - (1000 - i));

      attempts.push({
        userId: user._id,
        quizId: quiz._id,
        startedAt: date,
        submittedAt: new Date(date.getTime() + timeSpent * 1000),
        totalScore: score,
        passedStatus: passed,
        status: "submitted",
        summary: {
          totalQuestions: 10,
          answeredQuestions: 10,
          correctAnswers: score,
          wrongAnswers: 10 - score,
          percentage: score * 10,
          timeSpentSeconds: timeSpent,
        },
      });
    }
    await Attempt.insertMany(attempts);
    logger.info("Inserted 1000 attempts.");

    // 6. Create UserStatistics
    const levelStats = [];
    for (let l = 1; l <= 6; l++) {
      levelStats.push({
        level: l,
        attempts: 166, // Roughly 1000 / 6
        passed: Math.floor(Math.random() * 80) + 40,
        averageScore: Math.floor(Math.random() * 4) + 6,
        lastAttempt: new Date(),
        bestScore: 10,
        worstScore: 2,
      });
    }

    const typeStats = topics
      .map((t) => ({
        type: t,
        total: 100,
        correct: Math.floor(Math.random() * 60) + 30,
        percentage: 0, // Will calculate
      }))
      .map((s) => ({
        ...s,
        percentage: Math.round((s.correct / s.total) * 100),
      }));

    await UserStatistics.create({
      userId: user._id,
      totalAttempts: 1000,
      totalPassedQuizzes: passedCount,
      averageScore: Math.round((totalScoreAll / 1000) * 10) / 10,
      totalStudyTime: totalStudyTime,
      levelStatistics: levelStats,
      questionTypeStats: typeStats,
      currentStreak: 5,
      longestStreak: 12,
      lastActivityDate: new Date(),
      targetLevel: 4,
      progressPercentage: 65,
    });
    logger.info("Created user statistics.");

    logger.info("Large seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    logger.error("Large seeding failed: %O", err);
    process.exit(1);
  }
};

seedLargeData();

