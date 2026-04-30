const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/environment');
const { ConflictError, AuthError, NotFoundError } = require('../utils/errors');
const { successResponse } = require('../utils/helpers');

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res, next) => {
  try {
    const { email, password, username, fullName, hskLevel } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new ConflictError(
        existing.email === email ? 'Email already in use' : 'Username already taken'
      );
    }

    const user = await User.create({ email, password, username, fullName, hskLevel });
    const token = signToken(user._id);

    return successResponse(
      res,
      { token, user: user.toSafeObject() },
      'Registration successful',
      201
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AuthError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthError('Account is inactive');
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    return successResponse(res, { token, user: user.toSafeObject() }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new NotFoundError('User not found');
    return successResponse(res, { user: user.toSafeObject() }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { username, fullName, hskLevel } = req.body;

    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) throw new ConflictError('Username already taken');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, fullName, hskLevel },
      { new: true, runValidators: true }
    );

    return successResponse(res, { user: user.toSafeObject() }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe, updateMe };
