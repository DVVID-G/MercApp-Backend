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
  const prod = await productService.createProduct({ name: 'Café', price: 8.5, umd: 'g', marca: 'Juan Valdez', packageSize: 250, barcode: 'CAFE001', categoria: 'Bebidas' })

  const result = await purchaseService.createPurchase('user-1', [
    { name: prod.name, price: prod.price, quantity: 2, marca: prod.marca, packageSize: prod.packageSize, umd: prod.umd, barcode: prod.barcode, categoria: prod.categoria },
  ])

  expect(result.purchase.items[0].price).toBe(prod.price)
  expect(result.purchase.items[0].name).toBe(prod.name)
  expect(result.purchase.total).toBeCloseTo(prod.price * 2)
})

test('createPurchase requiere todos los campos en items', async () => {
  await expect(
    purchaseService.createPurchase('user-2', [{ name: 'Test', price: 10, quantity: 1 } as any])
  ).rejects.toThrow()
})

test('listPurchases filters by from/to and supports pagination', async () => {
  // create purchases with different createdAt dates
  const base = new Date('2025-01-01T00:00:00.000Z')
  const p1 = await Purchase.create({ userId: 'u1', items: [{ name: 'A', price: 1, quantity: 1, marca: 'Test', packageSize: 100, umd: 'gramos', barcode: 'A001', categoria: 'Otros' }], total: 1, createdAt: base })
  const p2 = await Purchase.create({ userId: 'u1', items: [{ name: 'B', price: 2, quantity: 1, marca: 'Test', packageSize: 100, umd: 'gramos', barcode: 'B001', categoria: 'Otros' }], total: 2, createdAt: new Date('2025-01-15T00:00:00.000Z') })
  const p3 = await Purchase.create({ userId: 'u1', items: [{ name: 'C', price: 3, quantity: 1, marca: 'Test', packageSize: 100, umd: 'gramos', barcode: 'C001', categoria: 'Otros' }], total: 3, createdAt: new Date('2025-02-01T00:00:00.000Z') })

  // filter between 2025-01-10 and 2025-01-31 should return only p2
  const res = await purchaseService.listPurchases('u1', { from: '2025-01-10', to: '2025-01-31', page: 1, limit: 10 })
  expect(res.totalCount).toBe(1)
  expect(res.docs.length).toBe(1)
  expect(res.docs[0]._id.toString()).toBe(p2._id.toString())
})
