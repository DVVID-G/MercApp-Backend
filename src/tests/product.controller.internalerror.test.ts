import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import User from '../models/user.model'
import Product from '../models/product.model'
import * as productService from '../services/product.service'
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

test('POST /products -> service throws => 500 and error bubbled', async () => {
  const password = await hashPassword('adminPass1!')
  await User.create({ name: 'A', email: 'a@example.com', passwordHash: password })
  const login = await request(app).post('/auth/login').send({ email: 'a@example.com', password: 'adminPass1!' })
  const token = login.body.token

  const spy = jest.spyOn(productService, 'createProduct').mockImplementation(() => {
    throw new Error('service fail')
  })
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Err', price: 5 })

    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('message', 'service fail')
    // allow async logging to finish while console is mocked
    await new Promise((resolve) => setImmediate(resolve))
  } finally {
    consoleSpy.mockRestore()
    spy.mockRestore()
  }
})
