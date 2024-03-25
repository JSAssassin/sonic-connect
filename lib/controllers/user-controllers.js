import asyncErrorHandller from '../utils/async-error-handler.js';
import CustomError from '../utils/custom-error.js';
import filterUserData from '../utils/filter-user-data.js';
import signLoginToken from '../utils/sign-login-token.js';
import User from '../models/user-model.js';

const updateMe = asyncErrorHandller(async (req, res, next) => {
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
    id, filteredData, { runValidators: true });
  const token = signLoginToken(id);
  res.status(200).json({
    status: 'Successful.',
    token,
    user: updatedUser
  });
});

// eslint-disable-next-line no-unused-vars
const deactivateMe = asyncErrorHandller(async (req, res, next) => {
  const { _id: id } = req.user;
  await User.findByIdAndUpdate(id, { active: false });
  res.status(204).json({
    status: 'Successful.',
    user: null
  })
});

export {
  deactivateMe,
  updateMe
};
