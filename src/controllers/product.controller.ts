import { Request, Response, NextFunction } from 'express'
import * as productService from '../services/product.service'
import { createProductSchema } from '../validators/product.validator'

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createProductSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.format() })
    }

    const product = await productService.createProduct(parsed.data)
    return res.status(201).json(product)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createProduct error', err)
    return next(err)
  }
}

export async function listProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await productService.listProducts()
    return res.status(200).json(items)
  } catch (err) {
    return next(err)
  }
}
