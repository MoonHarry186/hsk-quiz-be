const User = require("../models/User");
const { NotFoundError } = require("../utils/errors");
const {
  successResponse,
  paginate,
  buildPaginatedResponse,
} = require("../utils/helpers");

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { role, isActive, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total, stats] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
      (async () => {
        return {
          total: await User.countDocuments(),
          activeToday: await User.countDocuments({
            lastLoginAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          }),
          newThisWeek: await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          }),
        };
      })(),
    ]);

    const paginatedResponse = buildPaginatedResponse(users, total, page, limit);

    return successResponse(
      res,
      {
        results: {
          users: paginatedResponse.results,
          stats,
        },
        meta: paginatedResponse.meta,
      },
      "Users retrieved",
    );
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { role, isActive, hskLevel } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role, isActive, hskLevel },
      { new: true, runValidators: true },
    );
    if (!user) throw new NotFoundError("User not found");
    return successResponse(res, { user }, "User updated");
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) throw new NotFoundError("User not found");
    return successResponse(res, null, "User deleted");
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, updateUser, deleteUser };

