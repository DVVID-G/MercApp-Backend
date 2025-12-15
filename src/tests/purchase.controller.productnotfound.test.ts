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

test('POST /purchases -> missing required fields => 400 (validation error)', async () => {
  const password = await hashPassword('adminPass1!')
  await User.create({ name: 'A', email: 'a@example.com', passwordHash: password })
  const login = await request(app).post('/auth/login').send({ email: 'a@example.com', password: 'adminPass1!' })
  const token = login.body.accessToken

  // Missing required fields: marca, packageSize, umd, barcode, categoria
  const payload = { items: [{ name: 'Test', price: 10, quantity: 1 }] }

  const res = await request(app).post('/purchases').set('Authorization', `Bearer ${token}`).send(payload)
  expect(res.status).toBe(400)
  expect(res.body).toHaveProperty('errors')
})
