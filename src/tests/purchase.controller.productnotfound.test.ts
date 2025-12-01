import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import User from '../models/user.model'
import { hashPassword } from '../services/auth.service'

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  const uri = mongo.getUri()
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

beforeEach(async () => {
  await User.deleteMany({})
})

test('POST /purchases -> productId does not exist => 500 (service error)', async () => {
  const password = await hashPassword('adminPass1!')
  await User.create({ name: 'A', email: 'a@example.com', passwordHash: password })
  const login = await request(app).post('/auth/login').send({ email: 'a@example.com', password: 'adminPass1!' })
  const token = login.body.token

  const payload = { items: [{ productId: '000000000000000000000000', quantity: 1 }] }

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const res = await request(app).post('/purchases').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('message')
  } finally {
    consoleSpy.mockRestore()
  }
})
