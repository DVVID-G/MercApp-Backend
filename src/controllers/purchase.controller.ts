import { Request, Response, NextFunction } from 'express'
import { CreatePurchaseSchema, ListPurchasesQuery } from '../validators/purchase.validator'
import * as purchaseService from '../services/purchase.service'

export async function createPurchase(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const parse = CreatePurchaseSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ errors: parse.error.format() })

    const { purchase, priceWarnings } = await purchaseService.createPurchase(userId, parse.data.items)
    
    // Incluir warnings de precio si existen
    const response: any = { 
      id: purchase.id, 
      total: purchase.total, 
      createdAt: purchase.createdAt 
    }
    
    if (priceWarnings.length > 0) {
      response.priceWarnings = priceWarnings
    }
    
    return res.status(201).json(response)
  } catch (err) {
    return next(err)
  }
}

export async function listPurchases(req: Request, res: Response) {
  const userId = (req as any).userId
  if (!userId) return res.status(401).json({ message: 'Unauthorized' })

  const parsed = ListPurchasesQuery.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.format() })
  }

  const result = await purchaseService.listPurchases(userId, parsed.data)
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
