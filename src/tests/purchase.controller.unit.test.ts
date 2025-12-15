import { createPurchase, listPurchases, getPurchaseById } from '../controllers/purchase.controller'

describe('purchase.controller auth guards', () => {
  const buildRes = () => {
    const res: any = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
  }

  test('createPurchase returns 401 when userId is missing', async () => {
    const req: any = { body: {} }
    const res = buildRes()
    const next = jest.fn()

    await createPurchase(req, res as any, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  test('listPurchases returns 401 when userId is missing', async () => {
    const req: any = { query: {} }
    const res = buildRes()

    await listPurchases(req, res as any)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
  })

  test('getPurchaseById returns 401 when userId is missing', async () => {
    const req: any = { params: { id: '123' } }
    const res = buildRes()

    await getPurchaseById(req, res as any)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
  })
})
