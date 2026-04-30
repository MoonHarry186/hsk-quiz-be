require('dotenv').config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optional = (name, defaultValue) => process.env[name] || defaultValue;

module.exports = {
  PORT: optional('PORT', '3000'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  MONGODB_URI: required('MONGODB_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  GEMINI_API_KEY: required('GEMINI_API_KEY'),
  ADMIN_EMAIL: optional('ADMIN_EMAIL', 'admin@hskquiz.com'),
  ADMIN_PASSWORD: optional('ADMIN_PASSWORD', 'Admin@123456'),
  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:3001'),
  LOG_LEVEL: optional('LOG_LEVEL', 'dev'),
};
