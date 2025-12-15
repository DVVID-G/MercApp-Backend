import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Product from '../models/product.model'

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

test('calcula pum automáticamente al guardar', async () => {
  const p = await Product.create({ name: 'Aceite', price: 20, packageSize: 100, umd: 'g', marca: 'Test', barcode: 'TEST001', categoria: 'Condimentos' })
  expect(p.pum).toBeCloseTo(20 / 100)
})

test('no calcula pum si price es 0', async () => {
  const p = await Product.create({ name: 'Agua', price: 0, packageSize: 500, umd: 'ml', marca: 'Test', barcode: 'TEST002', categoria: 'Bebidas' })
  expect(p.pum).toBeUndefined()
})
