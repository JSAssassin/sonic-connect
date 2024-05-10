import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import { apiVersion } from './helpers.js';
import app from '../app.js';

describe('API /non-existent', () => {
  test('should error when an invalid endpoint is requested.',
    async () => {
      const response = await request(app)
        .get(`${apiVersion}/non-existent`)
        .expect(404);
      const { body: { message } } = response;
      expect(message).toContain(
        `Cannot find "${apiVersion}/non-existent" on the server.`);
    });
});
