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

test('POST /purchases payload inválido por validator devuelve 400', async () => {
  const password = await hashPassword('buyer')
  await User.create({ name: 'B', email: 'b@example.com', passwordHash: password })
  const login = await request(app).post('/auth/login').send({ email: 'b@example.com', password: 'buyer' })
  const token = login.body.token

  // item without productId and without name/price should fail
  const res = await request(app).post('/purchases').set('Authorization', `Bearer ${token}`).send({ items: [{ quantity: 1 }] })
  expect(res.status).toBe(400)
})
