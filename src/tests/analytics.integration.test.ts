import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import User from '../models/user.model'
import Product from '../models/product.model'
import Purchase from '../models/purchase.model'
import { hashPassword } from '../services/auth.service'

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

beforeEach(async () => {
  const db = mongoose.connection.db
  if (db) await db.dropDatabase()
})

test('analytics endpoint requires authentication', async () => {
  const res = await request(app).get('/analytics')
  expect(res.status).toBe(401)
})

test('returns monthly and category aggregates for the authenticated user', async () => {
  const passwordHash = await hashPassword('secret123')
  const user = await User.create({ name: 'Analyst', email: 'analyst@example.com', passwordHash })
  const otherUser = await User.create({ name: 'Other', email: 'other@example.com', passwordHash })

  const loginRes = await request(app).post('/auth/login').send({ email: 'analyst@example.com', password: 'secret123' })
  expect(loginRes.status).toBe(200)
  const token = loginRes.body.accessToken

  const milk = await Product.create({ 
    name: 'Milk', 
    price: 5, 
    categoria: 'Lácteos',
    marca: 'Alpina',
    packageSize: 1000,
    umd: 'ml',
    barcode: '1234567890001'
  })
  const apple = await Product.create({ 
    name: 'Apple', 
    price: 2, 
    categoria: 'Fruver',
    marca: 'Local',
    packageSize: 500,
    umd: 'gramos',
    barcode: '1234567890002'
  })

  const octPurchase = await Purchase.create({
    userId: user.id,
    items: [{ productId: milk.id, name: milk.name, price: 5, quantity: 2, marca: milk.marca, packageSize: milk.packageSize, umd: milk.umd, barcode: milk.barcode, categoria: milk.categoria }],
    total: 10,
  })
  await Purchase.collection.updateOne(
    { _id: octPurchase._id },
    { $set: { createdAt: new Date('2025-10-05T10:00:00Z') } }
  )

  const novPurchase = await Purchase.create({
    userId: user.id,
    items: [
      { productId: milk.id, name: milk.name, price: 5, quantity: 1, marca: milk.marca, packageSize: milk.packageSize, umd: milk.umd, barcode: milk.barcode, categoria: milk.categoria },
      { productId: apple.id, name: apple.name, price: 2, quantity: 3, marca: apple.marca, packageSize: apple.packageSize, umd: apple.umd, barcode: apple.barcode, categoria: apple.categoria },
    ],
    total: 11,
  })
  await Purchase.collection.updateOne(
    { _id: novPurchase._id },
    { $set: { createdAt: new Date('2025-11-10T10:00:00Z') } }
  )

  const otherNovPurchase = await Purchase.create({
    userId: user.id,
    items: [{ name: 'Cleaning', price: 4, quantity: 1, marca: 'Generic', packageSize: 100, umd: 'ml', barcode: '8888888888888', categoria: 'Aseo' }],
    total: 4,
  })
  await Purchase.collection.updateOne(
    { _id: otherNovPurchase._id },
    { $set: { createdAt: new Date('2025-11-15T10:00:00Z') } }
  )

  await Purchase.create({
    userId: otherUser.id,
    items: [{ name: 'Ignore', price: 100, quantity: 1, marca: 'Generic', packageSize: 100, umd: 'unidad', barcode: '9999999999999', categoria: 'Otros' }],
    total: 100,
  })

  const res = await request(app)
    .get('/analytics')
    .set('Authorization', `Bearer ${token}`)
    .query({ from: '2025-09-01', to: '2025-12-31' })

  expect(res.status).toBe(200)
  expect(res.body.data).toBeDefined()
  expect(Array.isArray(res.body.data.monthly)).toBe(true)
  expect(Array.isArray(res.body.data.categories)).toBe(true)

  const monthly = res.body.data.monthly
  const october = monthly.find((m: any) => m.month === '2025-10')
  const november = monthly.find((m: any) => m.month === '2025-11')
  expect(october.total).toBeCloseTo(10)
  expect(october.itemsCount).toBe(2)
  expect(november.total).toBeCloseTo(15)
  expect(november.itemsCount).toBe(5)

  const categories = res.body.data.categories
  const dairy = categories.find((c: any) => c.category === 'Lácteos')
  const produce = categories.find((c: any) => c.category === 'Fruver')
  const cleaning = categories.find((c: any) => c.category === 'Aseo')
  expect(dairy.total).toBeCloseTo(15)
  expect(dairy.itemsCount).toBe(3)
  expect(produce.total).toBeCloseTo(6)
  expect(produce.itemsCount).toBe(3)
  expect(cleaning.total).toBeCloseTo(4)
  expect(cleaning.itemsCount).toBe(1)
})

test('rejects invalid date ranges', async () => {
  const passwordHash = await hashPassword('secret123')
  await User.create({ name: 'Validator', email: 'validator@example.com', passwordHash })
  const loginRes = await request(app).post('/auth/login').send({ email: 'validator@example.com', password: 'secret123' })
  const token = loginRes.body.accessToken

  const res = await request(app)
    .get('/analytics')
    .set('Authorization', `Bearer ${token}`)
    .query({ from: '2025-12-31', to: '2025-01-01' })

  expect(res.status).toBe(400)
  expect(res.body.errors).toBeDefined()
})
