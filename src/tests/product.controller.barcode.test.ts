import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
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

test('GET /products/barcode/:barcode -> 200 with product when exists', async () => {
  const p = await Product.create({
    name: 'Test Product',
    price: 1.5,
    umd: 'unidad',
    barcode: 'BAR123',
    marca: 'Test Brand',
    packageSize: 1,
    categoria: 'Otros'
  })

  const res = await request(app).get(`/products/barcode/${p.barcode}`)
  expect(res.status).toBe(200)
  expect(res.body).toHaveProperty('barcode', 'BAR123')
  expect(res.body).toHaveProperty('name', 'Test Product')
})

test('GET /products/barcode/:barcode -> 404 when not found', async () => {
  const res = await request(app).get('/products/barcode/UNKNOWN')
  expect(res.status).toBe(404)
  expect(res.body).toHaveProperty('message')
})
