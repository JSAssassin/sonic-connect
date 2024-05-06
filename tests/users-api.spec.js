import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  deactivateUser, getUser, getUsers, loginUser, registerUsers, updatePassword
} from './helpers.js';

const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));

describe('API /users', () => {
  let adminJWT;
  let bobJWT;
  let aliceId;
  let aliceJWT;
  beforeEach(async () => {
    await removeAllCollections();
    // create mock users
    const registeredUsers = await registerUsers({ users: mockUsers });
    aliceId = {
      ...registeredUsers.find(
        user => user.name === 'alice')
    }.id;
    const adminLoginResponse = await loginUser({
      email: 'admin@email.com',
      password: 'admin1234567'
    });
    ({ body: { jwt: adminJWT } } = adminLoginResponse);
    expect(adminJWT).toBeDefined();
    const bobLoginResponse = await loginUser({
      email: 'bob@email.com',
      password: 'bob1234567'
    });
    ({ body: { jwt: bobJWT } } = bobLoginResponse);
    expect(bobJWT).toBeDefined();
    const aliceLoginResponse = await loginUser({
      email: 'alice@email.com',
      password: 'alice1234567'
    });
    ({ body: { jwt: aliceJWT } } = aliceLoginResponse);
  });
  afterAll(async () => {
    await removeAllCollections();
    await closeConnection();
  });
  describe('GET /users', () => {
    test('admin should be able to get all users.', async () => {
      const response = await getUsers({
        token: adminJWT
      });
      const { status, body: { count, data: { users } } } = response;
      expect(status).toBe(200);
      expect(count).toBe(mockUsers.length);
      expect(users).toBeDefined();
      expect(users).toBeInstanceOf(Array);
    });
    test('should throw when non-admin users try to get all users.',
      async () => {
        const response = await getUsers({
          token: bobJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
  })
  describe('GET /users/:userid', () => {
    test('admin and non-admin users should be able to get user with their ID.',
      async () => {
        // admin attempting to get a user should succeed
        const res1 = await getUser({
          userId: aliceId,
          token: adminJWT
        });
        const { status: status1, body: { data: { user: user1 } } } = res1;
        expect(status1).toBe(200);
        expect(user1).toBeDefined();
        expect(user1.name).toBe('alice');
        // user attempting to get another user should succeed
        const res2 = await getUser({
          userId: aliceId,
          token: bobJWT
        });
        const { status: status2, body: { data: { user: user2 } } } = res2;
        expect(status2).toBe(200);
        expect(user2).toBeDefined();
        expect(user2.name).toBe('alice');
      });
    test('should throw if user ID is invalid.', async () => {
      const invalidUserId = 'invalid-id';
      // attempting to get an invalid user id should fail
      const response = await getUser({
        userId: invalidUserId,
        token: adminJWT
      });
      const { status, body: { message } } = response;
      expect(status).toBe(400);
      expect(message).toContain(`Invalid value ${invalidUserId} for _id`);
    });
  })
  describe('DELETE /users/profile', () => {
    test('user should be able to deactivate their account', async () => {
      // user deactivates their account, this invalidates the JWT token and sets
      // the user's active status to false.
      const deactivateUserResponse = await deactivateUser({ token: aliceJWT });
      const {
        status: deactivateUserStatus, body: { message }
      } = deactivateUserResponse;
      expect(deactivateUserStatus).toBe(200);
      expect(message).toContain('account has been deactivated.');
    });
    test('user should be able to activate their account by logging in.',
      async () => {
        // user deactivates their account, this invalidates the JWT token and
        // sets the user's active status to false.
        const deactivateUserResponse = await deactivateUser({
          token: aliceJWT
        });
        const {
          status: deactivateUserStatus,
          body: { message: deactivateUserMessage }
        } = deactivateUserResponse;
        expect(deactivateUserStatus).toBe(200);
        expect(deactivateUserMessage).toContain(
          'account has been deactivated.');

        // try to get the deactivated account, this should fail
        const getUserResponse = await getUser({
          userId: aliceId,
          token: adminJWT
        });
        const {
          status: getUserStatus, body: { message: getUserMessage }
        } = getUserResponse;
        expect(getUserStatus).toBe(404);
        expect(getUserMessage).toContain(
          `User with ID "${aliceId}" not found.`);

        // user logs back into their account, this will reactivate the user
        // account
        await loginUser({
          email: 'alice@email.com',
          password: 'alice1234567'
        });

        // try to get the account again, should be now able to find the account
        // since it's been activated
        const getUserResponse2 = await getUser({
          userId: aliceId,
          token: adminJWT
        });
        const {
          status: getUserStatus2, body: { data: { user } }
        } = getUserResponse2;
        expect(getUserStatus2).toBe(200);
        expect(user).toBeDefined();
        expect(user.name).toBe('alice');
      });
  })
  describe('PATCH /users/password', () => {
    test('user should be able to update their password.', async () => {
      const newPassword = 'new-password';
      // this should update the password and logout the user.
      const updatePasswordResponse = await updatePassword({
        token: aliceJWT,
        newPassword,
        confirmPassword: newPassword,
        currentPassword: 'alice1234567'
      });
      const {
        status: updatePasswordStatus, body: { data: { user }, message }
      } = updatePasswordResponse;
      expect(updatePasswordStatus).toBe(200);
      expect(user).toHaveProperty('passwordChangedAt', expect.any(String));
      expect(user).toHaveProperty('name', 'alice');
      expect(message).toContain('Your password has been updated successfully.');
      // user attempts to login using old password, this should fail
      const loginWithOldPasswordResponse = await loginUser({
        email: 'alice@email.com',
        password: 'alice1234567'
      });
      const {
        status: loginWithOldPasswordStatus, body: { message: loginMessage }
      } = loginWithOldPasswordResponse;
      expect(loginWithOldPasswordStatus).toBe(401);
      expect(loginMessage).toContain('Incorrect password');
      // user attempts to login using new password, this should succeed
      const loginWithNewPasswordResponse = await loginUser({
        email: 'alice@email.com',
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
      expect(loggedInUser).toHaveProperty('name', 'alice');
    });
    test('should throw if no new password is provided.', async () => {
      const response = await updatePassword({
        token: aliceJWT,
        currentPassword: 'alice1234567'
      });
      const { status } = response;
      expect(status).toBe(400);
    });
    test('should throw if current password is not provided.', async () => {
      const newPassword = 'new-password';
      const response = await updatePassword({
        token: aliceJWT,
        newPassword,
        confirmPassword: newPassword,
      });
      const { status } = response;
      expect(status).toBe(400);
    });
    test('should throw if current password is incorrect.', async () => {
      const newPassword = 'new-password';
      const response = await updatePassword({
        token: aliceJWT,
        newPassword,
        confirmPassword: newPassword,
        currentPassword: 'incorrect-password'
      });
      const { status, body: { message } } = response;
      expect(status).toBe(401);
      expect(message).toContain('The current password you provided is wrong.');
    });
    test('should throw if new password is the same as the current password.',
      async () => {
        const newPassword = 'alice1234567';
        const response = await updatePassword({
          token: aliceJWT,
          newPassword,
          confirmPassword: newPassword,
          currentPassword: 'alice1234567'
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          'The new password must be different from the current password.');
      });
  })
});
