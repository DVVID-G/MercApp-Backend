import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import User from '../models/user.model'
import Product from '../models/product.model'
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
  await Product.deleteMany({})
})

test('POST /products sin token devuelve 401', async () => {
  const res = await request(app).post('/products').send({ name: 'X', price: 1 })
  expect(res.status).toBe(401)
})

test('POST /products con token inválido devuelve 401', async () => {
  const res = await request(app).post('/products').set('Authorization', 'Bearer invalid.token').send({ name: 'X', price: 1 })
  expect(res.status).toBe(401)
})

test('POST /products payload inválido devuelve 400', async () => {
  const password = await hashPassword('p')
  const user = await User.create({ name: 'U', email: 'u@example.com', passwordHash: password })
  const login = await request(app).post('/auth/login').send({ email: 'u@example.com', password: 'p' })
  const token = login.body.token

  const res = await request(app).post('/products').set('Authorization', `Bearer ${token}`).send({ price: -1 })
  expect(res.status).toBe(400)
})

test('GET /products/barcode/:barcode no existente devuelve 404', async () => {
  const res = await request(app).get('/products/barcode/NONE')
  expect(res.status).toBe(404)
})
