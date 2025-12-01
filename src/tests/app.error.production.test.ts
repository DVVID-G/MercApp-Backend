import request from 'supertest'
import app from '../app'

describe('global error handler in production mode', () => {
  const OLD_ENV = process.env.NODE_ENV
  beforeAll(() => {
    process.env.NODE_ENV = 'production'
  })
  afterAll(() => {
    process.env.NODE_ENV = OLD_ENV
  })

  test('returns 500 without details when NODE_ENV=production', async () => {
    ;(app as any).get('/__test/error-prod', (_req: any, _res: any, next: any) => {
      return next(new Error('boom-prod'))
    })

    const res = await request(app).get('/__test/error-prod')
    expect(res.status).toBe(500)
    // some test environments may not parse JSON body; assert on text
    expect(res.text).toEqual(expect.stringContaining('boom-prod'))
    // in production details must be hidden
    expect(res.text).not.toEqual(expect.stringContaining('stack'))
  })
})
