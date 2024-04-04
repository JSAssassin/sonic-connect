import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import filterUserData from '../utils/filter-data.js';
import User from '../models/user-model.js';

// eslint-disable-next-line no-unused-vars
const getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const activeUsers = await User.find();
  return createResponse({
    count: activeUsers.length,
    data: { users: activeUsers },
    res,
    statusCode: 200
  });
});

// eslint-disable-next-line no-unused-vars
const getUser = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    const e = new CustomError(`User with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { user }, res, statusCode: 200 });
});

const updatePassword = asyncErrorHandler(async (req, res, next) => {
  const { newPassword, currentPassword, confirmPassword } = req.body;
  if (!newPassword || !confirmPassword || !currentPassword) {
    const e = new CustomError(
      'Missing new password, confirm password or current password.', 400);
    return next(e);
  }
  if (newPassword === currentPassword) {
    const e = new CustomError(
      'The new password must be different from the current password.', 400);
    return next(e);
  }
  const { _id: id } = req.user;
  const user = await User.findById(id).select('+password');
  // check if current password provided is same as the one in database
  if (!user || !(await user.comparePassword(currentPassword, user.password))) {
    const e = new CustomError(
      'The current password you provided is wrong.', 401);
    return next(e);
  }
  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  user.updatedAt = Date.now();
  user.passwordChangedAt = Date.now();

  await user.save();
  user.password = undefined;
  res.clearCookie('jwt');
  const message = 'Your password has been updated successfully.';
  return createResponse({ data: { user }, message, res, statusCode: 200 });
});

// eslint-disable-next-line no-unused-vars
const getProfile = asyncErrorHandler(async (req, res, next) => {
  const { _id: id } = req.user;
  const user = await User.findById(id);
  return createResponse({ data: { user }, res, statusCode: 200 });
});

const updateProfile = asyncErrorHandler(async (req, res, next) => {
  const restrictedUpdateFields = [
    'email', 'passowrd', 'confirmPassword', 'role', 'active'
  ];
  if (Object.keys(req.body).forEach(prop =>
    restrictedUpdateFields.includes(prop))) {
    const e = CustomError('You cannot update email, password, role or ' +
      'active status using this endpoint.', 400);
    return next(e);
  }
  const allowedFields = ['name', 'photo'];
  const filteredData = filterUserData({ data: req.body, allowedFields });
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('You have not provided any permissible fields ' +
      'for updating, or the fields you have provided are not within the ' +
      'allowable list for updates.', 400);
    return next(e);
  }
  const { _id: id } = req.user;
  const updatedUser = await User.findByIdAndUpdate(
    id, filteredData, {
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true },
    new: true
  });
  updatedUser.password = undefined;
  return createResponse({ data: { user: updatedUser }, res, statusCode: 200 });
});

// eslint-disable-next-line no-unused-vars
const deactivateProfile = asyncErrorHandler(async (req, res, next) => {
  const { _id: id } = req.user;
  await User.findByIdAndUpdate(id, { active: false });
  res.clearCookie('jwt'); // Clear the JWT cookie
  return createResponse({
    data: { user: null },
    res,
    message: 'User deactivated.',
    statusCode: 204
  });
});

export {
  deactivateProfile,
  getAllUsers,
  getUser,
  getProfile,
  updateProfile,
  updatePassword
};
