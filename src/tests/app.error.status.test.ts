import request from 'supertest'
import app from '../app'

test('global error handler uses err.status when present', async () => {
  ;(app as any).get('/__test/error-status', (_req: any, _res: any, next: any) => {
    const err: any = new Error('custom')
    err.status = 418
    return next(err)
  })

  const res = await request(app).get('/__test/error-status')
  expect(res.status).toBe(418)
  // assert on response text to avoid JSON parse differences in some envs
  expect(res.text).toEqual(expect.stringContaining('custom'))
})
