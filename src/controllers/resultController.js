const Result = require('../models/Result');
const Attempt = require('../models/Attempt');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { successResponse } = require('../utils/helpers');

const getResult = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const isOwner = attempt.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) throw new ForbiddenError();

    const result = await Result.findOne({ attemptId: req.params.attemptId })
      .populate('quizId', 'title hskLevel passingScore')
      .populate('userId', 'username fullName');

    if (!result) throw new NotFoundError('Result not found');

    return successResponse(res, { result }, 'Result retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getResult };
