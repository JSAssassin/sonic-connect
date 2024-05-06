import request from 'supertest';
import app from '../app.js';

const apiVersion = '/api/v1';

const ping = async () => {
  const response = await request(app)
    .get(`${apiVersion}/ping`)
    .expect(200);
  return response;
}

const registerUser = async ({ newUser } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/signup`)
    .send(newUser);
  return response;
}

const loginUser = async ({ email, password } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/login`)
    .send({ email, password });
  return response;
}

const logoutUser = async ({ token } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/logout`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const sendPasswordResetRequest = async ({ email } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/forgotPassword`)
    .send({ email });
  return response;
}

const resetPassword = async ({
  newPassword, confirmPassword, passwordResetToken
} = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/auth/resetPassword/${passwordResetToken}`)
    .send({
      newPassword,
      confirmPassword
    });
  return response;
}

const getUsers = async ({ token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/users`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const getUser = async ({ userId, token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/users/${userId}`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const getUserProfile = async ({ token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/users/profile`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const updateUserProfile = async ({ token, updatedProfile } = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/users/profile`)
    .send({
      ...updatedProfile
    })
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const deactivateUser = async ({ token } = {}) => {
  const response = await request(app)
    .delete(`${apiVersion}/users/profile`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const updatePassword = async ({
  token, newPassword, confirmPassword, currentPassword
} = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/users/profile/password`)
    .send({
      newPassword,
      confirmPassword,
      currentPassword
    })
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const registerUsers = async ({ users }) => {
  const promises = users.map(async newUser => {
    const res = await registerUser({ newUser });
    const { body: { data: { user } } } = res;
    return user;
  });
  return Promise.all(promises);
}

export {
  apiVersion,
  deactivateUser,
  getUser,
  getUserProfile,
  getUsers,
  loginUser,
  logoutUser,
  ping,
  registerUser,
  registerUsers,
  resetPassword,
  sendPasswordResetRequest,
  updatePassword,
  updateUserProfile
};
