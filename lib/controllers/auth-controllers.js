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
  const newUser = new User({...req.body});
  const user = await newUser.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  res.status(201).json({
    status: 'Registration successful.',
    data: { user }
  });
});

export {
  login,
  register
}
