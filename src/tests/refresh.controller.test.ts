import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import * as authService from '../services/auth.service'
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

test('refresh devuelve 400 si falta refreshToken', async () => {
  const res = await request(app).post('/auth/refresh').send({})
  expect(res.status).toBe(400)
})

test('refresh devuelve 401 si token inválido', async () => {
  const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalid.token' })
  expect(res.status).toBe(401)
})

test('refresh devuelve 401 si token no registrado', async () => {
  // generate a valid refresh token not associated to any user in DB
  const token = authService.generateRefreshToken('no-user')
  const res = await request(app).post('/auth/refresh').send({ refreshToken: token })
  expect(res.status).toBe(401)
})
