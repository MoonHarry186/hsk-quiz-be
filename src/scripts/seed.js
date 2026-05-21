const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connect } = require('../config/database');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');
const logger = require('../utils/logger');

dotenv.config();

const seedData = async () => {
  try {
    await connect();
    logger.info('Connected to database for seeding...');

    // 1. Clear existing data
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    logger.info('Cleared existing quizzes and questions.');

    // 2. Find or create a superadmin for assignment
    let admin = await User.findOne({ role: 'superadmin' });
    if (!admin) {
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required before seeding a superadmin');
      }
      admin = await User.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        username: 'superadmin',
        fullName: 'Super Administrator',
        role: 'superadmin',
      });
      logger.info('Created superadmin user.');
    }

    const hskLevels = [1, 2, 3, 4];
    const topics = ['Daily Life', 'Work', 'Travel', 'Education', 'Food', 'Hobbies'];

    // 3. Create 4 quizzes
    for (let i = 1; i <= 4; i++) {
      const hskLevel = i;
      const quiz = await Quiz.create({
        title: `HSK ${hskLevel} Comprehensive Test`,
        description: `Full practice test for HSK Level ${hskLevel} with 25 questions.`,
        hskLevel: hskLevel,
        totalQuestions: 25,
        duration: 45,
        passingScore: 15,
        generatedByAI: false,
        createdBy: admin._id,
        isPublished: true,
      });

      logger.info(`Created Quiz: ${quiz.title}`);

      // 4. Create 25 questions for each quiz (Total 100)
      const quizQuestions = [];
      for (let j = 1; j <= 25; j++) {
        const questionType = 'multiple_choice';
        const qData = {
          quizId: quiz._id,
          content: `Question ${j} for HSK ${hskLevel}: This is a sample multiple choice question.`,
          questionType: questionType,
          hskLevel: hskLevel,
          explanation: `This is the explanation for question ${j}. It explains why the correct option was chosen.`,
          points: 1,
          topics: [topics[j % topics.length]],
          difficulty: j < 10 ? 'easy' : (j < 20 ? 'medium' : 'hard'),
          multipleChoice: {
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: Math.floor(Math.random() * 4),
          },
        };

        quizQuestions.push(qData);
      }

      const insertedQuestions = await Question.insertMany(quizQuestions);
      quiz.questionIds = insertedQuestions.map(q => q._id);
      await quiz.save();
      logger.info(`Inserted 25 questions for Quiz: ${quiz.title}`);
    }

    logger.info('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed: %O', err);
    process.exit(1);
  }
};

seedData();
