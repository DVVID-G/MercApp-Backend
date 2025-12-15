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
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('GET /auth/me', () => {
  it('should return user details for authenticated user', async () => {
    // 1. Create user
    const user = await authService.createUser('Me User', 'me@example.com', 'Pass123!');
    const token = authService.generateToken(user.id);

    // 2. Request /auth/me
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', user.id);
    expect(res.body).toHaveProperty('name', 'Me User');
    expect(res.body).toHaveProperty('email', 'me@example.com');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 401 if invalid token provided', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401); // Or 403 depending on middleware, but usually 401/403
  });
});
