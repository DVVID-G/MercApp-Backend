import Product from '../models/product.model'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

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
})

describe('product.service findByBarcode helper (model-level)', () => {
  test('create product and find by barcode via model', async () => {
    const p = await Product.create({ name: 'P2', price: 2, umd: 'u', barcode: 'B2' })
    const found = await Product.findOne({ barcode: 'B2' }).lean()
    expect(found).not.toBeNull()
    expect((found as any).barcode).toBe('B2')
  })
})
