import request from 'supertest';
import app from './app';

describe('Root endpoint', () => {
  it('GET / should return status ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
