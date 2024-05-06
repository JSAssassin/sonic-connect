import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  deactivateUser, getUser, getUsers, loginUser, registerUsers
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

        // log back into their account
        await loginUser({
          email: 'alice@email.com',
          password: 'alice1234567'
        });

        // try to get the account again, this should work
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
});
