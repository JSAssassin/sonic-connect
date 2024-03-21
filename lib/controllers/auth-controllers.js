import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import asyncErrorHandller from '../utils/async-error-handler.js';
import CustomError from '../utils/custom-error.js';
import sendEmail from '../utils/email.js';
import signLoginToken from '../utils/sign-login-token.js';
import User from '../models/user-model.js';

const login = asyncErrorHandller(async (req, res, next) => {
  const { email, password } = req.body;
  // get user from database.
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const e = new CustomError('User not found.', 404);
    next(e);
  }
  const isMatch = await user.comparePassword(password, user.password);
  if (!isMatch) {
    const e = new CustomError('Incorrect password.', 401);
    next(e);
  }
  const { _id: id } = user;
  const token = signLoginToken(id);
  res.status(200).json({
    status: 'Login successful.',
    token
  });
});

// eslint-disable-next-line no-unused-vars
const register = asyncErrorHandller(async (req, res, next) => {
  const newUser = new User({ ...req.body });
  const user = await newUser.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  res.status(201).json({
    status: 'Registration successful.',
    data: { user }
  });
});

const authenticate = asyncErrorHandller(async (req, res, next) => {
  // check if the token exists, if token exists it means user is logged in
  const testToken = req.headers.authorization;
  let token;
  if (testToken && testToken.startsWith('Bearer')) {
    [, token] = testToken.split(' ');
  }
  if (!token) {
    const e = new CustomError('You are not logged in.', 401);
    next(e);
  }
  const decodedToken = jwt.verify(token, process.env.SECRET_STR);
  // check if the user exists in DB and has not been removed after the token
  // issuance
  const user = await User.findById(decodedToken.userId);

  if (!user) {
    const e = new CustomError(
      'The user with the given token does not exist.', 401);
    next(e);
  }

  // check if user changed their password after the token was issued, if so
  // ask the user to log back into account again since password was changed
  const isPasswordChanged = user.isPasswordChanged(decodedToken.iat);
  if(isPasswordChanged) {
    const e = new CustomError(
      'The password has been changed recently. Please login again.', 401);
    next(e);
  }
  // Allow user to access route
  req.user = user;
  next()
});

const checkPermissions = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    const e = new CustomError(
      'You do not have to permission to perform this action.', 403);
    next(e);
  }
  next()
};

const forgotPassword = asyncErrorHandller(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    const e = new CustomError('Email is required.', 400);
    next(e);
  }
  const user = await User.findOne({ email });
  if (!user) {
    const e = new CustomError(
      `Could not find a user for the given email ${email}.`, 404);
    next(e);
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
    res.status(200).json({
      status: 'Successful.',
      message: 'Password reset link sent to the user email.'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    const e = new CustomError(
      'There was an error sending password reset email. Please try again ' +
      'later.', 500);
    next(e);
  }
});

const resetPassword = asyncErrorHandller(async (req, res, next) => {
  const {token} =req.params;
  const passwordResetToken =
    crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetTokenExpires: {$gt: Date.now()}
  });
  if(!user) {
    const e = new CustomError(
      'Password reset token either expired or is invalid.', 400);
    next(e);
  }
  const {newPassword, confirmPassword} = req.body;
  if(!(newPassword || confirmPassword)) {
    const e = new CustomError(
      'Please enter new password and confirm password.', 400);
    next(e);
  }
  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save({
    timestamps: { createdAt: false, updatedAt: true }
  });
  const {_id: id} = user;
  const loginToken = signLoginToken(id);

  res.status(200).json({
    status: 'Login successful.',
    token: loginToken
  });
});

export {
  authenticate,
  checkPermissions,
  forgotPassword,
  login,
  register,
  resetPassword
}
