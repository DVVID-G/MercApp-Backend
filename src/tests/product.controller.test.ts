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

test('POST /products protegido y GET /products y /products/barcode/:barcode', async () => {
  const password = await hashPassword('adminpass')
  await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: password })

  const loginRes = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'adminpass' })
  expect(loginRes.status).toBe(200)
  const token = loginRes.body.accessToken

  const createRes = await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Manteca', price: 3.5, barcode: 'BAR001', marca: 'Test Brand', packageSize: 250, umd: 'gramos', categoria: 'Lácteos' })
  expect(createRes.status).toBe(201)
  expect(createRes.body).toHaveProperty('barcode', 'BAR001')

  const listRes = await request(app).get('/products')
  expect(listRes.status).toBe(200)
  expect(Array.isArray(listRes.body)).toBe(true)

  const getRes = await request(app).get('/products/barcode/BAR001')
  expect(getRes.status).toBe(200)
  expect(getRes.body.name).toBe('Manteca')
})
