import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  getUsers, loginUser, registerUsers
} from './helpers.js';

const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));

describe('API /users', () => {
  let adminJWT;
  beforeEach(async () => {
    await removeAllCollections();
    // create mock users
    await registerUsers({ users: mockUsers });
    const admin = { ...mockUsers.find(user => user.email === 'admin@email.com') };
    const response = await loginUser({
      email: admin.email,
      password: admin.password
    });
    ({ body: { jwt: adminJWT } } = response);
    expect(adminJWT).toBeDefined();
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
      const { body: { count, data: { users } } } = response;
      expect(count).toBe(mockUsers.length);
      expect(users).toBeDefined();
      expect(users).toBeInstanceOf(Array);
    });
  })
});
