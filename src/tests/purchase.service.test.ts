import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import * as productService from '../services/product.service'
import * as purchaseService from '../services/purchase.service'
import Product from '../models/product.model'
import Purchase from '../models/purchase.model'

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

test('createPurchase enriquece items con datos del producto', async () => {
  const prod = await productService.createProduct({ name: 'Café', price: 8.5, umd: 'g' })

  const purchase = await purchaseService.createPurchase('user-1', [
    { productId: prod._id.toString(), quantity: 2 },
  ])

  expect(purchase.items[0].price).toBe(prod.price)
  expect(purchase.items[0].name).toBe(prod.name)
  expect(purchase.total).toBeCloseTo(prod.price * 2)
})

test('createPurchase lanza error si productId no existe', async () => {
  await expect(
    purchaseService.createPurchase('user-2', [{ productId: '000000000000000000000000', quantity: 1 }])
  ).rejects.toThrow(/Product not found/)
})

test('listPurchases filters by from/to and supports pagination', async () => {
  // create purchases with different createdAt dates
  const base = new Date('2025-01-01T00:00:00.000Z')
  const p1 = await Purchase.create({ userId: 'u1', items: [{ name: 'A', price: 1, quantity: 1 }], total: 1, createdAt: base })
  const p2 = await Purchase.create({ userId: 'u1', items: [{ name: 'B', price: 2, quantity: 1 }], total: 2, createdAt: new Date('2025-01-15T00:00:00.000Z') })
  const p3 = await Purchase.create({ userId: 'u1', items: [{ name: 'C', price: 3, quantity: 1 }], total: 3, createdAt: new Date('2025-02-01T00:00:00.000Z') })

  // filter between 2025-01-10 and 2025-01-31 should return only p2
  const res = await purchaseService.listPurchases('u1', { from: '2025-01-10', to: '2025-01-31', page: 1, limit: 10 })
  expect(res.totalCount).toBe(1)
  expect(res.docs.length).toBe(1)
  expect(res.docs[0]._id.toString()).toBe(p2._id.toString())
})
