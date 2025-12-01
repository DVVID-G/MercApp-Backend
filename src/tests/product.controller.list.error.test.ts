import request from 'supertest'
import app from '../app'
import * as productService from '../services/product.service'

test('listProducts forwards errors to global handler and returns 500', async () => {
  const spy = jest.spyOn(productService, 'listProducts').mockImplementation(() => {
    throw new Error('boom-list')
  })

  const res = await request(app).get('/products')
  expect(res.status).toBe(500)
  expect(res.text).toEqual(expect.stringContaining('boom-list'))

  spy.mockRestore()
})
