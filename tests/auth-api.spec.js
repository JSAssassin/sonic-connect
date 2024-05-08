import {
  afterAll, beforeEach, describe, expect, jest, test
} from '@jest/globals';
import nodemailer from 'nodemailer';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  getUserProfile, loginUser, logoutUser, sendPasswordResetRequest, registerUser,
  resetPassword
} from './helpers.js';

const users = JSON.parse(fs.readFileSync("./mock-data/users.json"));

describe('API /auth', () => {
  afterAll(async () => {
    await removeAllCollections();
    await closeConnection();
  });
  describe('POST /auth/signup', () => {
    beforeEach(async () => {
      await removeAllCollections();
    });
    test('should register a new user.', async () => {
      const newUser = { ...users.find(user => user.email === 'bob@email.com') };
      const response = await registerUser({ newUser });
      const { status, body: { data: { user } } } = response;
      expect(status).toBe(201);
      expect(user).toBeDefined();
      expect(user).toHaveProperty('id', expect.any(String));
      expect(user).toHaveProperty('name', newUser.name);
      expect(user).toHaveProperty('createdAt', expect.any(String));
    });
    test('should result in duplicate error if user attempts to register ' +
      'again with existing email.', async () => {
        const newUser = {
          ...users.find(user => user.email === 'bob@email.com')
        };
        const response1 = await registerUser({ newUser });
        const { status: status1, body: { data: { user: user1 } } } = response1;
        expect(status1).toBe(201);
        expect(user1).toBeDefined();
        expect(user1).toHaveProperty('id', expect.any(String));
        expect(user1).toHaveProperty('name', newUser.name);
        expect(user1).toHaveProperty('createdAt', expect.any(String));
        const response2 = await registerUser({ newUser });
        const { status: status2, body: { message } } = response2;
        expect(status2).toBe(409);
        expect(message).toContain(
          `There is already a record with the email "${newUser.email}"`);
      });
    test('should throw error if email is not specified.', async () => {
      const newUser = { ...users.find(user => user.email === 'bob@email.com') };
      delete newUser.email;
      const response = await registerUser({ newUser });
      const { status, body: { message } } = response;
      expect(status).toBe(400);
      expect(message).toContain('Invalid input data:');
    });
    test('should throw error if password and confirmPassword is not specified.',
      async () => {
        const newUser =
          { ...users.find(user => user.email === 'bob@email.com') };
        delete newUser.password;
        delete newUser.confirmPassword;
        const response = await registerUser({ newUser });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain('Invalid input data:');
      });
  })
  describe('POST /auth/login', () => {
    const newUser = { ...users.find(user => user.email === 'bob@email.com') };
    beforeEach(async () => {
      await removeAllCollections();
      // register a new user before each test.
      const response = await registerUser({ newUser });
      const { status } = response;
      expect(status).toBe(201);
    });
    test('logging in a user should return a JWT token.', async () => {
      // log in the user with their email and password
      const response = await loginUser({
        email: newUser.email,
        password: newUser.password
      });
      const { status, body: { jwt, data: { user } } } = response;
      expect(status).toBe(200);
      expect(jwt).toBeDefined();
      expect(user).toHaveProperty('name', newUser.name);
    });
    test('should throw an error if email/password is not provided for login.',
      async () => {
        const response = await loginUser({});
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toBe('Please provide your email and password.');
      });
    test('should throw an error if password is incorrect.', async () => {
      // Attempt to log in the user with incorrect password
      const response = await loginUser({
        email: newUser.email,
        password: 'incorrect-password'
      });
      const { status, body: { message } } = response;
      expect(status).toBe(401);
      expect(message).toContain('Incorrect password');
    });
    test('should throw an error if email does not exist.', async () => {
      // Attempt to log in the user with incorrect email
      const response = await loginUser({
        email: 'invalid-bob@email.com',
        password: newUser.password
      });
      const { status, body: { message } } = response;
      expect(status).toBe(404);
      expect(message).toContain('Could not find a user');
    });
  })
  describe('POST /auth/forgotPassword & PATCH /auth/resetPassword/:token', () => {
    const newUser = { ...users.find(user => user.email === 'bob@email.com') };
    let passwordResetToken;
    // mock the sendMail method of nodemailer's transporter to handle email
    // sending
    nodemailer.createTransport = jest.fn(() => ({
      sendMail: jest.fn(async ({ text }) => {
        // extracting the password reset token from the email content.
        [, passwordResetToken] =
          text.match(/resetPassword\/([a-fA-F0-9]+)/);
        return { messageId: 'test' };
      })
    }));
    beforeEach(async () => {
      await removeAllCollections();
      // register a new user
      const response = await registerUser({ newUser });
      const { status } = response;
      expect(status).toBe(201);
    });
    test('should successfully reset a user password.', async () => {
      // user requests to reset their password
      const passwordResetRequestResponse =
        await sendPasswordResetRequest({ email: newUser.email });
      const {
        status: passwordResetRequestStatus, body: { message }
      } = passwordResetRequestResponse;
      expect(passwordResetRequestStatus).toBe(200);
      expect(message).toContain('Password reset link sent');
      // User resets their password using the password reset link received in
      // their email. Nodemailer's sendMail has been mocked to extract the
      // password reset token for testing purposes.
      const newPassword = 'new-password';
      const resetPasswordResponse = await resetPassword({
        passwordResetToken, newPassword, confirmPassword: newPassword
      });
      const {
        status: resetPasswordStatus, body: { data: { user } }
      } = resetPasswordResponse;
      expect(resetPasswordStatus).toBe(200);
      expect(user).toHaveProperty('passwordChangedAt', expect.any(String));
      expect(user).toHaveProperty('name', newUser.name);
      // Attempt to login with old password should fail
      const loginWithOldPasswordResponse = await loginUser({
        email: newUser.email,
        password: newUser.password
      });
      const {
        status: loginWithOldPasswordStatus, body: { message: loginMessage }
      } = loginWithOldPasswordResponse;
      expect(loginWithOldPasswordStatus).toBe(401);
      expect(loginMessage).toContain('Incorrect password');
      // Attempt to login with the new password should be successful
      const loginWithNewPasswordResponse = await loginUser({
        email: newUser.email,
        password: newPassword
      });
      const {
        status: loginWithNewPasswordStatus,
        body: {
          jwt, data: { user: loggedInUser }
        }
      } = loginWithNewPasswordResponse;
      expect(loginWithNewPasswordStatus).toBe(200);
      expect(jwt).toBeDefined();
      expect(loggedInUser).toHaveProperty('name', newUser.name);
    });
    test('should throw if email is not provided when user requests to ' +
      'reset password.', async () => {
        // user requests to reset their password
        const response = await sendPasswordResetRequest();
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain('Email is required');
      });
    test('should throw if email provided  does not exist when user requests ' +
      'to reset password.', async () => {
        // user requests to reset their password
        const response = await sendPasswordResetRequest({
          email: 'non-existent@email.,com'
        });
        const { status, body: { message } } = response;
        expect(status).toBe(404);
        expect(message).toContain('Could not find a user for the given email');
      });
    test('should throw if password reset token is invalid when user attempts ' +
      'to reset password.', async () => {
        passwordResetToken = 'invalid-token';
        const newPassword = 'new-password';
        const response = await resetPassword({
          passwordResetToken, newPassword, confirmPassword: newPassword
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          'Password reset token either expired or is invalid.');
      });
    test('should throw if new password or confirm password is not provided ' +
      'when user attempts to reset password.', async () => {
        // user requests to reset their password
        const passwordResetRequestResponse =
          await sendPasswordResetRequest({ email: newUser.email });
        const {
          status: passwordResetRequestStatus,
          body: { message: passwordResetMessage }
        } = passwordResetRequestResponse;
        expect(passwordResetRequestStatus).toBe(200);
        expect(passwordResetMessage).toContain('Password reset link sent');
        const resetPasswordResponse = await resetPassword({
          passwordResetToken
        });
        const {
          status: resetPasswordStatus,
          body: { message: resetPasswordMessage }
        } = resetPasswordResponse;
        expect(resetPasswordStatus).toBe(400);
        expect(resetPasswordMessage).toContain(
          'Please enter new password and confirm password.');
      });
    test('should throw if new password is the same as the old password ' +
      'when user attempts to reset password.', async () => {
        // user requests to reset their password
        const passwordResetRequestResponse =
          await sendPasswordResetRequest({ email: newUser.email });
        const {
          status: passwordResetRequestStatus,
          body: { message: passwordResetMessage }
        } = passwordResetRequestResponse;
        expect(passwordResetRequestStatus).toBe(200);
        expect(passwordResetMessage).toContain('Password reset link sent');
        const oldPassword = newUser.password;
        const resetPasswordResponse = await resetPassword({
          passwordResetToken,
          newPassword: oldPassword,
          confirmPassword: oldPassword
        });
        const {
          status: resetPasswordStatus,
          body: { message: resetPasswordMessage }
        } = resetPasswordResponse;
        expect(resetPasswordStatus).toBe(400);
        expect(resetPasswordMessage).toContain(
          'New password must not be the same as the old password.');
      });
  })
  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      await removeAllCollections();
    });
    test('should invalidate JWT token when user logs out.', async () => {
      const newUser = { ...users.find(user => user.email === 'bob@email.com') };
      // register a new user
      const resgisterResponse = await registerUser({ newUser });
      const { status: resgisterStatus } = resgisterResponse;
      expect(resgisterStatus).toBe(201);
      // log in the user
      const loginResponse = await loginUser({
        email: newUser.email,
        password: newUser.password
      });
      const {
        status: loginStatus, body: { jwt, data: { user } }
      } = loginResponse;
      expect(loginStatus).toBe(200);
      expect(jwt).toBeDefined();
      expect(user).toHaveProperty('name', newUser.name);
      // user should be able to get their profile (user details)
      const getUserProfileResponse = await getUserProfile({ token: jwt });
      const {
        status: getUserProfileStatus, body: { data: { user: userDetails } }
      } = getUserProfileResponse;
      expect(getUserProfileStatus).toBe(200);
      expect(userDetails).toHaveProperty('name', newUser.name);
      expect(userDetails).toHaveProperty('email', newUser.email);
      // log out user, this should invalidate the token
      const logoutUserResponse = await logoutUser({ token: jwt });
      const {
        status: logoutUserStatus, body: { message: logoutMessage }
      } = logoutUserResponse;
      expect(logoutUserStatus).toBe(200);
      expect(logoutMessage).toContain('successfully logged out');
      // try getting the profile again, this should fail and should ask the
      // user to log in since logging out invalidates the JWT token
      const getProfileResponse = await getUserProfile({ token: jwt });
      const {
        status: getProfileStatus, body: { message: getUserProfileMessage }
      } = getProfileResponse;
      expect(getProfileStatus).toBe(401);
      expect(getUserProfileMessage).toContain(
        'The given token is no longer valid. Please login again.');
    });
  })
});
