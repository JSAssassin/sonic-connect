import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  getUser, getUsers, loginUser, registerUsers
} from './helpers.js';

const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));

describe('API /users', () => {
  let adminJWT;
  let bobJWT;
  let aliceId;
  beforeEach(async () => {
    await removeAllCollections();
    // create mock users
    const registeredUsers = await registerUsers({ users: mockUsers });
    const alice = {
      ...registeredUsers.find(
        user => user.name === 'alice')
    };
    aliceId = alice.id;
    const admin = {
      ...mockUsers.find(
        user => user.email === 'admin@email.com')
    };
    const bob = {
      ...mockUsers.find(
        user => user.email === 'bob@email.com')
    };
    const adminLoginResponse = await loginUser({
      email: admin.email,
      password: admin.password
    });
    ({ body: { jwt: adminJWT } } = adminLoginResponse);
    expect(adminJWT).toBeDefined();
    const bobLoginResponse = await loginUser({
      email: bob.email,
      password: bob.password
    });
    ({ body: { jwt: bobJWT } } = bobLoginResponse);
    expect(bobJWT).toBeDefined();
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
    test('should throw if user ID is invalid or non existent.', async () => {
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
});
