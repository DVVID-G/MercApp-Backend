import Purchase, { IPurchaseItem } from '../models/purchase.model'
import * as productService from './product.service'

/**
 * Crea una compra, auto-sincronizando productos al catálogo.
 * 
 * Para cada item:
 * 1. Valida que tenga todos los campos requeridos (name, marca, price, packageSize, umd, barcode, categoria)
 * 2. Busca o crea el producto en el catálogo usando findOrCreateFromPurchaseItem
 * 3. Si el producto existe y el precio cambió, retorna flag priceChanged para notificar al frontend
 * 4. Enriquece el item con productId, pum y otros datos del producto
 * 
 * @param userId Id del usuario que realiza la compra
 * @param items Lista de items de la compra
 * @returns { purchase, priceWarnings } donde priceWarnings contiene items con precio diferente
 */
export async function createPurchase(userId: string, items: Array<Partial<IPurchaseItem>>) {
  const priceWarnings: Array<{ itemIndex: number; catalogPrice: number; newPrice: number }> = []

  // Auto-sync productos al catálogo y enriquecer items
  const enrichedItems = await Promise.all(
    items.map(async (it, index) => {
      // Validar campos requeridos
      if (!it.name || !it.marca || !it.price || !it.packageSize || !it.umd || !it.barcode || !it.categoria) {
        throw new Error(
          `Item ${index}: Faltan campos requeridos (name, marca, price, packageSize, umd, barcode, categoria)`
        )
      }

      // Buscar o crear producto en catálogo
      const { product, created, priceChanged } = await productService.findOrCreateFromPurchaseItem({
        name: it.name,
        marca: it.marca,
        price: it.price,
        packageSize: it.packageSize,
        umd: it.umd,
        barcode: it.barcode,
        categoria: it.categoria,
      })

      // Si el producto existía y el precio cambió, registrar warning
      if (!created && priceChanged) {
        priceWarnings.push({
          itemIndex: index,
          catalogPrice: product.price,
          newPrice: it.price,
        })
      }

      // Retornar item enriquecido con datos del catálogo
      return {
        productId: product._id.toString(),
        name: product.name,
        marca: product.marca,
        price: it.price, // Usar el precio del item (puede ser diferente al catálogo)
        quantity: it.quantity || 1,
        packageSize: product.packageSize,
        pum: product.pum,
        umd: product.umd,
        barcode: product.barcode,
        categoria: product.categoria,
      } as IPurchaseItem
    })
  )

  const total = enrichedItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0)
  const purchase = new Purchase({ userId, items: enrichedItems, total })
  await purchase.save()
  
  return { purchase, priceWarnings }
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
