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

test('create purchase (authenticated)', async () => {
  const password = await hashPassword('secret123')
  const user = await User.create({ name: 'Buyer', email: 'buyer@example.com', passwordHash: password })

  // login to get token
  const loginRes = await request(app).post('/auth/login').send({ email: 'buyer@example.com', password: 'secret123' })
  expect(loginRes.status).toBe(200)
  const token = loginRes.body.token

  const payload = {
    items: [
      { name: 'Item A', price: 10.5, quantity: 2 },
      { name: 'Item B', price: 5, quantity: 1 },
    ],
  }

  const res = await request(app)
    .post('/purchases')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)

  expect(res.status).toBe(201)
  expect(res.body).toHaveProperty('id')
  expect(res.body.total).toBeCloseTo(10.5 * 2 + 5 * 1)
})

test('create purchase unauthorized', async () => {
  const res = await request(app).post('/purchases').send({ items: [{ name: 'x', price: 1, quantity: 1 }] })
  expect(res.status).toBe(401)
})

test('list purchases with pagination and detail', async () => {
  const password = await hashPassword('secret123')
  const user = await User.create({ name: 'Lister', email: 'lister@example.com', passwordHash: password })
  const loginRes = await request(app).post('/auth/login').send({ email: 'lister@example.com', password: 'secret123' })
  const token = loginRes.body.token

  // create several purchases
  for (let i = 0; i < 15; i++) {
    await request(app)
      .post('/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ name: `Item ${i}`, price: 1 + i, quantity: 1 }] })
  }

  const listRes = await request(app).get('/purchases').set('Authorization', `Bearer ${token}`).query({ page: 2, limit: 5 })
  expect(listRes.status).toBe(200)
  expect(listRes.body).toHaveProperty('data')
  expect(Array.isArray(listRes.body.data)).toBe(true)
  expect(listRes.body.meta.page).toBe(2)
  expect(listRes.body.meta.limit).toBe(5)

  // detail
  const firstId = listRes.body.data[0]._id || listRes.body.data[0].id
  const detail = await request(app).get(`/purchases/${firstId}`).set('Authorization', `Bearer ${token}`)
  expect(detail.status).toBe(200)
  expect(detail.body).toHaveProperty('items')
})
