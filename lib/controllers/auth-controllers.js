import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import sendEmail from '../utils/email.js';
import User from '../models/user-model.js';

const login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const e = new CustomError('Please provide your email and password.', 400);
    return next(e);
  }
  // get user from database.
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const e = new CustomError(
      `Could not find a user for the given email ${email}.`, 404);
    return next(e);
  }
  const isMatch = await user.comparePassword(password, user.password);
  if (!isMatch) {
    const e = new CustomError('Incorrect password.', 401);
    return next(e);
  }
  const { _id: userId, name } = user;
  const data = {
    user: {
      id: userId,
      name
    }
  };
  const message = 'User successfully logged in.';
  return createResponse({
    data, message, res, statusCode: 200, includeJwt: true
  });
});

// eslint-disable-next-line no-unused-vars
const logout = asyncErrorHandler(async (req, res, next) => {
  res.clearCookie('jwt'); // Clear the JWT cookie
  const message = 'User successfully logged out.';
  return createResponse({ res, message, statusCode: 200 });
});

// eslint-disable-next-line no-unused-vars
const signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = new User({ ...req.body });
  const user = await newUser.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  const message = 'User successfully signed up.';
  const { _id: userId, name, createdAt } = user;
  const data = {
    user: {
      id: userId,
      name,
      createdAt
    }
  };
  return createResponse({ data, message, res, statusCode: 201 });
});

const authenticate = asyncErrorHandler(async (req, res, next) => {
  // check if the token exists, if token exists it means user is logged in
  const token = req.cookies.jwt;
  if (!token) {
    const e = new CustomError('You are not logged in.', 401);
    return next(e);
  }
  const decodedToken = jwt.verify(token, process.env.SECRET_STR);
  // check if the user exists in DB and has not been removed after the token
  // issuance
  const user = await User.findById(decodedToken.userId);

  if (!user) {
    const e = new CustomError(
      'The user with the given token does not exist.', 401);
    return next(e);
  }

  // check if user changed their password after the token was issued, if so
  // ask the user to log back into account again since password was changed
  const isPasswordChanged = user.isPasswordChanged(decodedToken.iat);
  if (isPasswordChanged) {
    const e = new CustomError(
      'The password has been changed recently. Please login again.', 401);
    return next(e);
  }
  // Allow user to access route
  req.user = user;
  return next();
});

const checkPermissions = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    const e = new CustomError(
      'You do not have to permission to perform this action.', 403);
    return next(e);
  }
  return next()
};

const forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    const e = new CustomError('Email is required.', 400);
    return next(e);
  }
  const user = await User.findOne({ email });
  if (!user) {
    const e = new CustomError(
      `Could not find a user for the given email ${email}.`, 404);
    return next(e);
  }
  // Create and save a password reset token
  const resetToken = user.createPasswordResetToken();
  // save the user with the new password reset token and token expires
  // properties without validation
  user.save({ validateBeforeSave: false });
  // Create the password reset link to be sent in the message to user email
  const resetUrl =
    `${req.protocol}://${req.hostname}/api/v1/users/resetPassword/${resetToken}`;
  const message = `We have received a password reset request. Please use the ` +
    `link below to reset your password.\n\n${resetUrl}\n\nThis reset ` +
    `password link will be valid only for 10 minutes.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset request received.',
      message
    });
    const responseMessage = 'Password reset link sent to the user email.'
    return createResponse({ message: responseMessage, res, statusCode: 200 });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    const e = new CustomError(
      'There was an error sending password reset email. Please try again ' +
      'later.', 500);
    return next(e);
  }
});

const resetPassword = asyncErrorHandler(async (req, res, next) => {
  const { token } = req.params;
  const passwordResetToken =
    crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetTokenExpires: { $gt: Date.now() }
  }).select('+password');
  if (!user) {
    const e = new CustomError(
      'Password reset token either expired or is invalid.', 400);
    return next(e);
  }
  const { newPassword, confirmPassword } = req.body;
  if (!(newPassword || confirmPassword)) {
    const e = new CustomError(
      'Please enter new password and confirm password.', 400);
    return next(e);
  }
  // new password cannot be the same as the password in DB
  const isMatch = await user.comparePassword(newPassword, user.password);
  if (isMatch) {
    const e = new CustomError(
      'New password must not be the same as the old password.', 400);
    return next(e);
  }
  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save({
    timestamps: { createdAt: false, updatedAt: true }
  });

  user.password = undefined;
  const data = { user };
  const message = 'Password has been successfully reset.';
  return createResponse({ data, message, res, statusCode: 200, includeJwt: true });
});

export {
  authenticate,
  checkPermissions,
  forgotPassword,
  login,
  logout,
  resetPassword,
  signup
}
