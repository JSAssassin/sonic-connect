import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import setupDB from './test-db-setup.js';

// Setup a Test Database
await setupDB();

const apiVersion = '/api/v1';

describe('GET /auth', () => {
  it('should register a new user.', async () => {
    const newUser = {
      "name": "bob",
      "email": "bob@email.com",
      "password": "bob1234567",
      "confirmPassword": "bob1234567"
    }
    const response = await request(app)
      .post(`${apiVersion}/auth/signup`)
      .send(newUser);
    const { status, body } = response;
    const { data: { user } } = body;
    expect(status).toBe(201);
    expect(user).toBeDefined();
    expect(user).toHaveProperty('id', expect.any(String));
    expect(user).toHaveProperty('name', newUser.name);
    expect(user).toHaveProperty('createdAt', expect.any(String));
  });
});
