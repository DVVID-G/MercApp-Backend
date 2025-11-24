import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app';

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

describe('POST /auth/signup', () => {
  it('should create a user with valid payload', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Aa123456!',
      confirmPassword: 'Aa123456!'
    };

    const res = await request(app).post('/auth/signup').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});
