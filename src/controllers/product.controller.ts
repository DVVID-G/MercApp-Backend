import { Request, Response, NextFunction } from 'express'
import * as productService from '../services/product.service'
import { createProductSchema } from '../validators/product.validator'

/**
 * Controlador para crear un producto.
 * @param req Request entrante con payload validado por `createProductSchema`.
 */
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

/**
 * Lista todos los productos.
 */
export async function listProducts(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await productService.listProducts()
    return res.status(200).json(items)
  } catch (err) {
    return next(err)
  }
}

/**
 * Recupera un producto por su código de barras (`barcode`).
 * Respuestas: 400 si falta barcode, 404 si no se encuentra.
 */
export async function getProductByBarcode(req: Request, res: Response, next: NextFunction) {
  try {
    const { barcode } = req.params
    if (!barcode) return res.status(400).json({ message: 'Barcode is required' })
    const product = await productService.findByBarcode(barcode)
    if (!product) return res.status(404).json({ message: 'Product not found', barcode })
    return res.status(200).json(product)
  } catch (err) {
    return next(err)
  }
}
