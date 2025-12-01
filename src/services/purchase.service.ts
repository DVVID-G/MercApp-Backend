import Purchase, { IPurchaseItem } from '../models/purchase.model'
import * as productService from './product.service'

/**
 * Crea una compra, enriqueciendo los items que referencian un `productId`
 * con los datos actuales del producto (price, name, umd). Si el producto
 * no existe, lanza un error.
 * @param userId Id del usuario que realiza la compra
 * @param items Lista de items de la compra (pueden referenciar `productId`)
 */
export async function createPurchase(userId: string, items: Array<Partial<IPurchaseItem>>) {
  // Enrich items that reference a productId with current product data (price, name, umd)
  const enrichedItems = await Promise.all(
    items.map(async (it) => {
      if (it.productId) {
        const p = await productService.findProductById(it.productId)
        if (!p) throw new Error(`Product not found: ${it.productId}`)
        return {
          ...it,
          price: p.price,
          name: p.name,
          umd: p.umd || it.umd,
        } as IPurchaseItem
      }
      return it
    })
  )

  const total = enrichedItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0)
  const purchase = new Purchase({ userId, items: enrichedItems, total })
  await purchase.save()
  return purchase
}

export async function listPurchases(
  userId: string,
  options?: { page?: number; limit?: number; sort?: string; from?: string; to?: string }
) {
  const page = options?.page && options.page > 0 ? options.page : 1
  const limit = options?.limit && options.limit > 0 ? options.limit : 10
  const sort = options?.sort || '-createdAt'
  const filter: any = { userId }

  if (options?.from) {
    filter.createdAt = { $gte: new Date(options.from) }
  }
  if (options?.to) {
    filter.createdAt = filter.createdAt ? { ...filter.createdAt, $lte: new Date(options.to) } : { $lte: new Date(options.to) }
  }

  const skip = (page - 1) * limit
  const docs = await Purchase.find(filter).sort(sort).skip(skip).limit(limit).exec()
  const totalCount = await Purchase.countDocuments(filter).exec()
  return { docs, totalCount, page, limit }
}

export async function getPurchaseById(userId: string, id: string) {
  return Purchase.findOne({ _id: id, userId }).exec()
}

export default { createPurchase, listPurchases, getPurchaseById }
