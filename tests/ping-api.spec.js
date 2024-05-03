import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import apiVersion from './test-config.js';

describe('API /ping', () => {
  test('GET /ping - should return a successful response.', async () => {
    const response = await request(app)
      .get(`${apiVersion}/ping`)
      .expect(200);
    const { body } = response;
    expect(body).toEqual({
      status: 'ok', data: { version: '1.0.0' }
    });
  });
});
