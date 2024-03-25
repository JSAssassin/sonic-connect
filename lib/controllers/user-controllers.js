import asyncErrorHandller from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';
import filterUserData from '../utils/filter-user-data.js';
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
    id, filteredData, {
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true },
    returnDocument: 'after'
  });
  createResponse({ user: updatedUser, res, statusCode: 200 });
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
