import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app';
import * as authService from '../services/auth.service';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collection: any = collections[key];
    await collection.deleteMany({});
  }
});

describe('POST /auth/login', () => {
  it('should return a token for valid credentials', async () => {
    // Create a user first
    await authService.createUser('Login Test', 'login@example.com', 'Aa123456!');

    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'Aa123456!'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('expiresIn');

    // Use refresh token to obtain new access token
    const refreshRes = await request(app).post('/auth/refresh').send({ refreshToken: res.body.refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');

    // Logout should revoke the refresh token
    const logoutRes = await request(app).post('/auth/logout').send({ refreshToken: refreshRes.body.refreshToken });
    expect(logoutRes.status).toBe(200);
  });
});
