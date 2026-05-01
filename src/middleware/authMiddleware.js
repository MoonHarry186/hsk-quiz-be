const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/environment');
const { AuthError, ForbiddenError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AuthError('No token provided'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('+isActive');
    if (!user || !user.isActive) {
      return next(new AuthError('User not found or inactive'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AuthError('Invalid or expired token'));
    }
    next(err);
  }
};

const tryAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('+isActive');
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (err) {
    // If token is invalid, just proceed without user
    next();
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AuthError());
    
    // Always allow superadmin
    if (req.user.role === 'superadmin') return next();
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};

module.exports = { authenticate, authorize, tryAuthenticate };
