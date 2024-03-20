import jwt from 'jsonwebtoken';
import asyncErrorHandller from '../utils/async-error-handler.js';
import CustomError from '../utils/custom-error.js';
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
  const token = jwt.sign({
    userId: id
  }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
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

export {
  authenticate,
  checkPermissions,
  login,
  register
}
