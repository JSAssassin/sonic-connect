import jwt from 'jsonwebtoken';
import asyncErrorHandller from '../utils/async-error-handler.js';
import User from '../models/user-model.js';

const login = asyncErrorHandller(async (req, res, next) => {
  const { email, password } = req.body;
  // get user from database.
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ message: 'Incorrect password' });
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

const register = asyncErrorHandller(async (req, res, next) => {
  const { username, email, password } = req.body;
  const newUser = new User({
    username,
    email,
    password
  });
  const user = await newUser.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  res.status(201).json({
    status: 'Registration successful.',
    data: { user }
  });
});

export { login, register }
