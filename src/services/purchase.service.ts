import Purchase, { IPurchaseItem } from '../models/purchase.model'
import * as productService from './product.service'

/**
 * Crea una compra, auto-sincronizando productos al catálogo.
 * 
 * Para cada item:
 * 1. Valida que tenga todos los campos requeridos según el tipo de producto
 * 2. Busca o crea el producto en el catálogo usando findOrCreateFromPurchaseItem
 * 3. Si el producto existe y el precio cambió, retorna flag priceChanged para notificar al frontend
 * 4. Enriquece el item con productId, pum y otros datos del producto
 * 5. Almacena el precio unitario en price según el tipo:
 *    - Regular: price (precio por paquete)
 *    - Fruver: pum (precio por gramo)
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
      // Validar campos comunes requeridos
      if (!it.name || !it.marca || !it.umd || !it.categoria || !it.productType) {
        throw new Error(
          `Item ${index}: Faltan campos requeridos (name, marca, umd, categoria, productType)`
        )
      }

      // Validar campos específicos según tipo
      if (it.productType === 'regular') {
        if (!it.price || !it.packageSize || !it.barcode) {
          throw new Error(`Item ${index}: Producto regular requiere price, packageSize y barcode`)
        }
      } else if (it.productType === 'fruver') {
        if (!it.pum || it.pum <= 0) {
          throw new Error(`Item ${index}: Producto fruver requiere pum`)
        }
        if (!it.quantity || typeof it.quantity !== 'number' || it.quantity <= 0) {
          throw new Error(`Item ${index}: Producto fruver requiere pum y quantity > 0`)
        }
      }

      // Buscar producto por ID si existe
      let product = null
      if (it.productId) {
        product = await productService.findProductById(it.productId)
      }

      // Si es regular con barcode, buscar o crear en catálogo
      if (it.productType === 'regular' && it.barcode) {
        const { product: catalogProduct, created, priceChanged } = await productService.findOrCreateFromPurchaseItem({
          name: it.name,
          marca: it.marca,
          price: it.price!,
          packageSize: it.packageSize!,
          umd: it.umd,
          barcode: it.barcode,
          categoria: it.categoria,
        })

        product = catalogProduct

        // Si el producto existía y el precio cambió, registrar warning
        if (!created && priceChanged) {
          priceWarnings.push({
            itemIndex: index,
            catalogPrice: catalogProduct.price || 0,
            newPrice: it.price!,
          })
        }
      }

      // Almacenar precio unitario según tipo
      let unitPrice = 0
      if (it.productType === 'regular') {
        unitPrice = it.price || 0
      } else if (it.productType === 'fruver') {
        unitPrice = it.pum || 0
      }

      // Retornar item enriquecido
      return {
        productId: product?._id.toString(),
        name: it.name,
        marca: it.marca,
        price: unitPrice,
        quantity: it.quantity || 1,
        productType: it.productType,
        packageSize: it.productType === 'regular' ? it.packageSize : undefined,
        pum: it.pum || product?.pum,
        umd: it.umd,
        barcode: it.barcode,
        categoria: it.categoria,
      } as IPurchaseItem
    })
  )

  const total = enrichedItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 0)), 0)
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
