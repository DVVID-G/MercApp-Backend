import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import * as productService from '../services/product.service'
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

test('createProduct y findByBarcode funcionan correctamente', async () => {
  const created = await productService.createProduct({ name: 'Queso', price: 10, barcode: 'ABC123' })
  expect(created).toHaveProperty('barcode', 'ABC123')

  const found = await productService.findByBarcode('ABC123')
  expect(found).not.toBeNull()
  expect(found!.name).toBe('Queso')
})

test('listProducts devuelve array', async () => {
  await productService.createProduct({ name: 'Leche', price: 2 })
  const list = await productService.listProducts()
  expect(Array.isArray(list)).toBe(true)
  expect(list.length).toBeGreaterThanOrEqual(1)
})
