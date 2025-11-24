import Purchase, { IPurchaseItem } from '../models/purchase.model'

export async function createPurchase(userId: string, items: IPurchaseItem[]) {
  const total = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0)
  const purchase = new Purchase({ userId, items, total })
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
