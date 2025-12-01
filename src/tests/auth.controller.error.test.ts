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

test('login devuelve 400 en payload inválido', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'no-password@example.com' })
  expect(res.status).toBe(400)
  expect(res.body).toHaveProperty('message', 'Validation failed')
})

test('login devuelve 401 en credenciales inválidas', async () => {
  const password = await hashPassword('pass123')
  await User.create({ name: 'Test', email: 'test@example.com', passwordHash: password })

  const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'wrong' })
  expect(res.status).toBe(401)
})

test('signup devuelve 400 en payload inválido', async () => {
  const res = await request(app).post('/auth/signup').send({ email: 'incomplete' })
  expect(res.status).toBe(400)
})

test('signup devuelve 409 al registrar email duplicado', async () => {
  const valid = 'Dup12345!'
  const password = await hashPassword(valid)
  await User.create({ name: 'Dup', email: 'dup@example.com', passwordHash: password })

  const res = await request(app).post('/auth/signup').send({ name: 'Dup', email: 'dup@example.com', password: valid, confirmPassword: valid })
  expect(res.status).toBe(409)
})
