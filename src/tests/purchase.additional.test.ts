import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import * as purchaseService from '../services/purchase.service'
import Product from '../models/product.model'
import Purchase from '../models/purchase.model'
import app from '../app'

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
  await Product.deleteMany({})
  await Purchase.deleteMany({})
})

test('createPurchase accepts items without productId and computes total', async () => {
  const result = await purchaseService.createPurchase('u-no-prod', [
    { 
      name: 'DirectItem', 
      price: 4.5, 
      quantity: 3,
      marca: 'Test Brand',
      packageSize: 100,
      umd: 'gramos',
      barcode: '9999999999999',
      categoria: 'Otros'
    },
  ])

  expect(result.purchase.items[0].name).toBe('DirectItem')
  expect(result.purchase.items[0].price).toBe(4.5)
  expect(result.purchase.total).toBeCloseTo(13.5)
})

test('listPurchases with only from filter returns expected docs', async () => {
  const base = new Date('2025-03-01T00:00:00.000Z')
  const p1 = await Purchase.create({ userId: 'u2', items: [{ name: 'A', price: 1, quantity: 1, marca: 'Test', packageSize: 100, umd: 'gramos', barcode: '6666666666666', categoria: 'Otros' }], total: 1, createdAt: base })
  const p2 = await Purchase.create({ userId: 'u2', items: [{ name: 'B', price: 2, quantity: 1, marca: 'Test', packageSize: 100, umd: 'gramos', barcode: '7777777777777', categoria: 'Otros' }], total: 2, createdAt: new Date('2025-03-10T00:00:00.000Z') })

  const res = await purchaseService.listPurchases('u2', { from: '2025-03-05', page: 1, limit: 10 })
  expect(res.totalCount).toBe(1)
  expect(res.docs.length).toBe(1)
  expect(res.docs[0]._id.toString()).toBe(p2._id.toString())
})

test('purchase routes return 401 when unauthenticated', async () => {
  const createRes = await request(app).post('/purchases').send({ items: [] })
  expect(createRes.status).toBe(401)

  const listRes = await request(app).get('/purchases')
  expect(listRes.status).toBe(401)

  const getRes = await request(app).get('/purchases/000000000000000000000000')
  expect(getRes.status).toBe(401)
})
