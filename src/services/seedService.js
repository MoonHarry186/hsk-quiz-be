const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('../config/environment');
const logger = require('../utils/logger');

/**
 * Seeds the superadmin user if it doesn't exist
 */
const seedSuperAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'superadmin' });
    
    if (!adminExists) {
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping superadmin seeding.');
        return;
      }

      await User.create({
        username: 'superadmin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        fullName: 'System Administrator',
        role: 'superadmin',
        hskLevel: 6,
        isActive: true
      });
      
      logger.info('Superadmin account created successfully');
    }
  } catch (error) {
    logger.error('Error seeding superadmin:', error);
  }
};

/**
 * Initial migration/seeding tasks for production
 */
const runMigrations = async () => {
  logger.info('Running system migrations...');
  await seedSuperAdmin();
  // Add other migration tasks here (e.g. creating default quizzes)
  logger.info('Migrations completed');
};

module.exports = { runMigrations, seedSuperAdmin };
