import Purchase from '../models/purchase.model'

export interface AnalyticsFilters {
  from?: Date
  to?: Date
}

export interface MonthlyStat {
  month: string
  total: number
  itemsCount: number
}

export interface CategoryStat {
  category: string
  total: number
  itemsCount: number
}

export interface AnalyticsOverviewResult {
  range: { from: Date; to: Date }
  monthly: MonthlyStat[]
  categories: CategoryStat[]
}

function resolveRange(filters: AnalyticsFilters): { from: Date; to: Date } {
  const now = filters.to ? new Date(filters.to) : new Date()
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)
  const from = filters.from
    ? new Date(filters.from)
    : (() => {
        const fallback = new Date(now)
        fallback.setMonth(fallback.getMonth() - 5)
        fallback.setDate(1)
        return fallback
      })()
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

export async function getAnalyticsOverview(userId: string, filters: AnalyticsFilters = {}): Promise<AnalyticsOverviewResult> {
  const range = resolveRange(filters)

  const match: Record<string, any> = {
    userId,
    createdAt: {
      $gte: range.from,
      $lte: range.to,
    },
  }

  const monthlyPromise = Purchase.aggregate<MonthlyStat>([
    { $match: match },
    {
      $addFields: {
        itemsQuantity: {
          $reduce: {
            input: '$items',
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.quantity', 0] }] },
          },
        },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$total' },
        itemsCount: { $sum: '$itemsQuantity' },
      },
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' },
              ],
            },
          ],
        },
        total: 1,
        itemsCount: 1,
      },
    },
    { $sort: { month: 1 } },
  ])

  const categoriesPromise = Purchase.aggregate<CategoryStat>([
    { $match: match },
    { $unwind: '$items' },
    {
      $addFields: {
        category: {
          $ifNull: ['$items.categoria', 'Sin categoría'],
        },
        unitPrice: '$items.price',
        quantity: {
          $ifNull: ['$items.quantity', 0],
        },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: { $multiply: ['$unitPrice', '$quantity'] } },
        itemsCount: { $sum: '$quantity' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: 1,
        itemsCount: 1,
      },
    },
    { $sort: { total: -1 } },
  ])

  const [monthly, categories] = await Promise.all([monthlyPromise, categoriesPromise])

  return { range, monthly, categories }
}

export default { getAnalyticsOverview }