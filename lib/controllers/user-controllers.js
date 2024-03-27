import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';
import filterUserData from '../utils/filter-user-data.js';
import User from '../models/user-model.js';

// eslint-disable-next-line no-unused-vars
const getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const activeUsers = await User.find();
  res.status(200).json({
    status: 'success',
    count: activeUsers.length,
    data: {
      users: activeUsers
    }
  })
})

// eslint-disable-next-line no-unused-vars
const getUser = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    const err = new CustomError(`User with id "${id}" not found.`, 404);
    next(err);
  }
  res.status(200).json({
    status: 'success',
    data: { user }
  })
})

const updatePassword = asyncErrorHandler(async (req, res, next) => {
  const { newPassword, currentPassword, confirmPassword } = req.body;
  if (!newPassword || !confirmPassword || !currentPassword) {
    const e = new CustomError(
      'Missing new password, confirm password or current password.', 400);
    next(e);
  }
  if (newPassword === currentPassword) {
    const e = new CustomError(
      'The new password must be different from the current password.', 400);
    next(e);
  }
  const { _id: id } = req.user;
  const user = await User.findById(id).select('+password');
  // check if current password provided is same as the one in database
  if (!user || !(await user.comparePassword(currentPassword, user.password))) {
    const e = new CustomError(
      'The current password you provided is wrong.', 401);
    next(e);
  }
  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  user.updatedAt = Date.now();
  user.passwordChangedAt = Date.now();

  await user.save();
  user.password = undefined;
  createResponse({ user, res, statusCode: 200 });
})

// eslint-disable-next-line no-unused-vars
const getProfile = asyncErrorHandler(async (req, res, next) => {
  const { _id: id } = req.user;
  const user = await User.findById(id);
  res.status(200).json({
    status: 'success',
    data: { user }
  })
})

const updateProfile = asyncErrorHandler(async (req, res, next) => {
  const restrictedUpdateFields = [
    'email', 'passowrd', 'confirmPassword', 'role', 'active'
  ];
  if (Object.keys(req.body).forEach(prop =>
    restrictedUpdateFields.includes(prop))) {
    const e = CustomError('You cannot update email, password, role or ' +
      'active status using this endpoint.', 400);
    next(e);
  }
  const filteredData = filterUserData(req.body);
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('No fields are provided for updating. Please ' +
      'include fields you want to update.', 400);
    next(e);
  }
  const { _id: id } = req.user;
  const updatedUser = await User.findByIdAndUpdate(
    id, filteredData, {
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true },
    returnDocument: 'after'
  });
  updatedUser.password = undefined;
  createResponse({ user: updatedUser, res, statusCode: 200 });
});

// eslint-disable-next-line no-unused-vars
const deactivateProfile = asyncErrorHandler(async (req, res, next) => {
  const { _id: id } = req.user;
  await User.findByIdAndUpdate(id, { active: false });
  res.clearCookie('jwt'); // Clear the JWT cookie
  res.status(204).json({
    status: 'User deactivated.',
    user: null
  })
});

export {
  deactivateProfile,
  getAllUsers,
  getUser,
  getProfile,
  updateProfile,
  updatePassword
};
