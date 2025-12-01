import { Request, Response, NextFunction } from 'express'
import { CreatePurchaseSchema } from '../validators/purchase.validator'
import * as purchaseService from '../services/purchase.service'

export async function createPurchase(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const parse = CreatePurchaseSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ errors: parse.error.format() })

    const purchase = await purchaseService.createPurchase(userId, parse.data.items)
    return res.status(201).json({ id: purchase.id, total: purchase.total, createdAt: purchase.createdAt })
  } catch (err) {
    return next(err)
  }
}

export async function listPurchases(req: Request, res: Response) {
  const userId = (req as any).userId
  if (!userId) return res.status(401).json({ message: 'Unauthorized' })

  const { page, limit, sort, from, to } = req.query as any
  const opts = {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sort: sort || undefined,
    from: from || undefined,
    to: to || undefined,
  }

  const result = await purchaseService.listPurchases(userId, opts)
  return res.json({ data: result.docs, meta: { total: result.totalCount, page: result.page, limit: result.limit } })
}

export async function getPurchaseById(req: Request, res: Response) {
  const userId = (req as any).userId
  if (!userId) return res.status(401).json({ message: 'Unauthorized' })

  const id = req.params.id
  const purchase = await purchaseService.getPurchaseById(userId, id)
  if (!purchase) return res.status(404).json({ message: 'Not found' })
  return res.json(purchase)
}

export default { createPurchase }
