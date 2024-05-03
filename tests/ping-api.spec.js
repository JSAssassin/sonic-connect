import { describe, expect, test } from '@jest/globals';
import { ping } from './helpers.js';

describe('API /ping', () => {
  test('GET /ping - should return a successful response.', async () => {
    const response = await ping();
    const { body } = response;
    expect(body).toEqual({
      status: 'ok', data: { version: '1.0.0' }
    });
  });
});
