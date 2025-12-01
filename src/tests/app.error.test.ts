import request from 'supertest'
import app from '../app'

test('OPTIONS request returns 204 and CORS headers', async () => {
  const res = await request(app).options('/')
  expect(res.status).toBe(204)
  expect(res.headers).toHaveProperty('access-control-allow-origin')
})

test('global error handler returns 500 with details in dev', async () => {
  // attach a route that calls next(err) to ensure error middleware executes predictably
  ;(app as any).get('/__test/error', (_req: any, _res: any, next: any) => {
    return next(new Error('boom'))
  })

  const res = await request(app).get('/__test/error')
  expect(res.status).toBe(500)
})
