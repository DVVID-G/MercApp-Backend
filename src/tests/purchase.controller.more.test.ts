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

test('GET /purchases/:id devuelve 404 si no existe', async () => {
  const password = await hashPassword('buyer2')
  await User.create({ name: 'B2', email: 'b2@example.com', passwordHash: password })
  const login = await request(app).post('/auth/login').send({ email: 'b2@example.com', password: 'buyer2' })
  const token = login.body.token

  const res = await request(app).get('/purchases/000000000000000000000000').set('Authorization', `Bearer ${token}`)
  expect(res.status).toBe(404)
})
