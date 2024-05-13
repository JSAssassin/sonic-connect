import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { ObjectId } from 'bson';
import jwt from 'jsonwebtoken';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  deactivateUser, getUser, getUserProfile, getUsers, loginUser, registerUsers,
  updatePassword, updateUserProfile,
} from './helpers.js';

const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));

describe('API /users', () => {
  let adminJWT;
  let bobJWT;
  let aliceId;
  let aliceJWT;
  let oriJWT;
  beforeAll(async () => {
    await removeAllCollections();
    // create mock users
    const registeredUsers = await registerUsers({ users: mockUsers });
    ({ id: aliceId } = {
      ...registeredUsers.find(
        user => user.name === 'alice')
    });
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
    const oriLoginResponse = await loginUser({
      email: 'ori@email.com',
      password: 'ori1234567'
    });
    ({ body: { jwt: oriJWT } } = oriLoginResponse);
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
    test('should error when non-admin users try to get all users.',
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
    test('should error if user ID is invalid or non existent.', async () => {
      const nonExistentUserId = (new ObjectId()).toString();
      // attempting to get an invalid user id should fail
      const response = await getUser({
        userId: nonExistentUserId,
        token: adminJWT
      });
      const { status, body: { message } } = response;
      expect(status).toBe(404);
      expect(message).toContain(
        `User with ID "${nonExistentUserId}" not found.`);
    });
  })
  describe('DELETE /users/profile', () => {
    test('user should be able to deactivate their account and reactivate it ' +
      'by logging in.', async () => {
        // user deactivates their account, this invalidates the JWT token and
        // sets the user's active status to false.
        const deactivateUserResponse = await deactivateUser({
          token: aliceJWT
        });
        const {
          status: deactivateUserStatus, body: { message }
        } = deactivateUserResponse;
        expect(deactivateUserStatus).toBe(200);
        expect(message).toContain('account has been deactivated.');

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
        token: bobJWT,
        newPassword,
        confirmPassword: newPassword,
        currentPassword: 'bob1234567'
      });
      const {
        status: updatePasswordStatus, body: { data: { user }, message }
      } = updatePasswordResponse;
      expect(updatePasswordStatus).toBe(200);
      expect(user).toHaveProperty('passwordChangedAt', expect.any(String));
      expect(user).toHaveProperty('name', 'bob');
      expect(message).toContain('Your password has been updated successfully.');
      // user attempts to login using old password, this should fail
      const loginWithOldPasswordResponse = await loginUser({
        email: 'bob@email.com',
        password: 'bob1234567'
      });
      const {
        status: loginWithOldPasswordStatus, body: { message: loginMessage }
      } = loginWithOldPasswordResponse;
      expect(loginWithOldPasswordStatus).toBe(401);
      expect(loginMessage).toContain('Incorrect password');
      // user attempts to login using new password, this should succeed
      const loginWithNewPasswordResponse = await loginUser({
        email: 'bob@email.com',
        password: newPassword
      });
      const {
        status: loginWithNewPasswordStatus,
        body: {
          jwt: newJwt, data: { user: loggedInUser }
        }
      } = loginWithNewPasswordResponse;
      expect(loginWithNewPasswordStatus).toBe(200);
      expect(newJwt).toBeDefined();
      expect(loggedInUser).toHaveProperty('name', 'bob');
    });
    test('should error if no new password is provided.', async () => {
      const response = await updatePassword({
        token: oriJWT,
        currentPassword: 'ori1234567'
      });
      const { status } = response;
      expect(status).toBe(400);
    });
    test('should error if current password is not provided.', async () => {
      const newPassword = 'new-password';
      const response = await updatePassword({
        token: oriJWT,
        newPassword,
        confirmPassword: newPassword,
      });
      const { status } = response;
      expect(status).toBe(400);
    });
    test('should error if current password is incorrect.', async () => {
      const newPassword = 'new-password';
      const response = await updatePassword({
        token: oriJWT,
        newPassword,
        confirmPassword: newPassword,
        currentPassword: 'incorrect-password'
      });
      const { status, body: { message } } = response;
      expect(status).toBe(401);
      expect(message).toContain('The current password you provided is wrong.');
    });
    test('should error if new password is the same as the current password.',
      async () => {
        const newPassword = 'ori1234567';
        const response = await updatePassword({
          token: oriJWT,
          newPassword,
          confirmPassword: newPassword,
          currentPassword: 'ori1234567'
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          'The new password must be different from the current password.');
      });
  })
  describe('PATCH /users/profile', () => {
    test('user should be able to update their profile.', async () => {
      const updatedProfile = {
        dob: {
          year: 1977,
          month: 11,
          day: 10
        }
      };
      const response = await updateUserProfile({
        updatedProfile,
        token: oriJWT
      });
      const { status, body: { data: { user } } } = response;
      expect(status).toBe(200);
      expect(user).toHaveProperty('name', 'ori');
      expect(user).toHaveProperty('dob', updatedProfile.dob);
    });
    test('should error if all the fields specified to be updated are non ' +
      'permissiable fields.', async () => {
        const updatedProfile = {
          age: 24,
          birth_country: 'USA'
        };
        const response = await updateUserProfile({
          updatedProfile,
          token: oriJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `You have not provided any permissible fields for updating`);
      });
    test('should error if user tries to update password using this endpoint.',
      async () => {
        const updatedProfile = {
          password: 'new-password'
        };
        const response = await updateUserProfile({
          updatedProfile,
          token: oriJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          'You cannot update email, password, role or active status ' +
          'using this endpoint.');
      });
    test('should error if user tries to update active status using this ' +
      'endpoint.', async () => {
        const updatedProfile = {
          active: false
        };
        const response = await updateUserProfile({
          updatedProfile,
          token: oriJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          'You cannot update email, password, role or active status ' +
          'using this endpoint.');
      });
    test('should error if user tries to update email using this endpoint.',
      async () => {
        const updatedProfile = {
          email: `new-email@email.com`
        };
        const response = await updateUserProfile({
          updatedProfile,
          token: oriJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          'You cannot update email, password, role or active status ' +
          'using this endpoint.');
      });
  })
  describe('GET /users/profile', () => {
    test('user should be able to get their profile when logged in.',
      async () => {
        const response = await getUserProfile({
          token: oriJWT
        });
        const { status, body: { data: { user } } } = response;
        expect(status).toBe(200);
        expect(user).toBeDefined();
        expect(user.name).toBe('ori');
        expect(user.email).toBe('ori@email.com');
      });
    test('should error if user tries to access the route without logging in.',
      async () => {
        const response = await getUserProfile();
        const { status, body: { message } } = response;
        expect(status).toBe(401);
        expect(message).toContain('You are not logged in.');
      });
    test('should error if user tries to access the route with JWT of a user ' +
      'that does not exist in the DB.', async () => {
        const nonExistentUserId = (new ObjectId()).toString();
        const token = await jwt.sign({
          userId: nonExistentUserId
        }, 'mysecretkey', {
          expiresIn: 86400000,
        });
        const response = await getUserProfile({ token });
        const { status, body: { message } } = response;
        expect(status).toBe(401);
        expect(message).toContain(
          'The user with the given token does not exist.');
      });
  })
});
