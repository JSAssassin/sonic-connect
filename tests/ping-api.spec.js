import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';

const apiVersion = '/api/v1';

describe('GET /ping', () => {
  it('should return a successful response.', async () => {
    const response = await request(app).get(`${apiVersion}/ping`);
    const { status, body } = response;
    expect(status).toBe(200);
    expect(body).toEqual({
      status: 'ok', data: { version: '1.0.0' }
    });
  });
});
