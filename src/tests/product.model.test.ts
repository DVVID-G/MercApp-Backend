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
  const p = await Product.create({ name: 'Aceite', price: 20, gramaje: 100, umd: 'g' })
  expect(p.pum).toBeCloseTo(100 / 20)
})

test('no calcula pum si price es 0', async () => {
  const p = await Product.create({ name: 'Agua', price: 0, gramaje: 500 })
  expect(p.pum).toBeUndefined()
})
