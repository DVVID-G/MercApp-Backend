import request from 'supertest'

describe('app initialization in production (morgan + error handler branches)', () => {
  const OLD_ENV = process.env.NODE_ENV
  beforeAll(() => {
    process.env.NODE_ENV = 'production'
    // Clear module cache so app is initialized under NODE_ENV=production
    jest.resetModules()
  })
  afterAll(() => {
    process.env.NODE_ENV = OLD_ENV
    jest.resetModules()
  })

  test('imports app in production and hides error details', async () => {
    // require the app after setting NODE_ENV
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const app = require('../app').default

    ;(app as any).get('/__test/prod-morgan', (_req: any, _res: any, next: any) => {
      return next(new Error('boom-morgan'))
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const res = await request(app).get('/__test/prod-morgan')
      expect(res.status).toBe(500)
      // In production the response must NOT expose stack traces; accept HTML or JSON bodies
      expect(res.text).not.toEqual(expect.stringContaining('stack'))
      // wait a tick to allow any async logging (morgan/error middleware) to complete while console is mocked
      await new Promise((resolve) => setImmediate(resolve))
    } finally {
      consoleSpy.mockRestore()
    }
  })
})
