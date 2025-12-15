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

export interface DayOfWeekStat {
  day: string
  total: number
}

export interface BrandStat {
  brand: string
  total: number
}

export interface AnalyticsOverviewResult {
  range: { from: Date; to: Date }
  monthly: MonthlyStat[]
  categories: CategoryStat[]
  spendingByDayOfWeek: DayOfWeekStat[]
  monthlyComparison: {
    currentMonthTotal: number
    previousMonthTotal: number
    percentageChange: number
  }
  purchaseFrequency: number
  spendingProjection: number
  brandDistribution: BrandStat[]
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

  const dayOfWeekPromise = Purchase.aggregate<DayOfWeekStat>([
    { $match: match },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        total: { $sum: '$total' },
      },
    },
    {
      $project: {
        _id: 0,
        day: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 1] }, then: 'Domingo' },
              { case: { $eq: ['$_id', 2] }, then: 'Lunes' },
              { case: { $eq: ['$_id', 3] }, then: 'Martes' },
              { case: { $eq: ['$_id', 4] }, then: 'Miércoles' },
              { case: { $eq: ['$_id', 5] }, then: 'Jueves' },
              { case: { $eq: ['$_id', 6] }, then: 'Viernes' },
              { case: { $eq: ['$_id', 7] }, then: 'Sábado' },
            ],
            default: 'Desconocido',
          },
        },
        total: 1,
      },
    },
    { $sort: { total: -1 } },
  ])

  const brandPromise = Purchase.aggregate<BrandStat>([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: { $ifNull: ['$items.marca', 'Sin marca'] },
        total: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 0] }] } },
      },
    },
    {
      $project: {
        _id: 0,
        brand: '$_id',
        total: 1,
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ])

  const [monthly, categories, spendingByDayOfWeek, brandDistribution] = await Promise.all([
    monthlyPromise,
    categoriesPromise,
    dayOfWeekPromise,
    brandPromise,
  ])

  // Monthly Comparison
  const currentMonthStat = monthly[monthly.length - 1] || { total: 0 }
  const previousMonthStat = monthly[monthly.length - 2] || { total: 0 }
  const percentageChange =
    previousMonthStat.total === 0
      ? currentMonthStat.total > 0
        ? 100
        : 0
      : ((currentMonthStat.total - previousMonthStat.total) / previousMonthStat.total) * 100

  // Purchase Frequency (Avg days between purchases)
  // We need dates for this. Let's fetch dates separately or assume from monthly count?
  // Better to fetch dates for accuracy.
  const dates = await Purchase.find(match).select('createdAt').sort({ createdAt: 1 })
  let avgDays = 0
  if (dates.length > 1) {
    const diffs = []
    for (let i = 1; i < dates.length; i++) {
      const diffTime = Math.abs(dates[i].createdAt.getTime() - dates[i - 1].createdAt.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      diffs.push(diffDays)
    }
    avgDays = diffs.reduce((a, b) => a + b, 0) / diffs.length
  }

  // Spending Projection
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const currentDay = now.getDate()
  
  // Only project if we are in the current month of the range (or range covers current month)
  // For simplicity, we'll project based on the last month in the 'monthly' array if it matches current month
  let spendingProjection = 0
  const lastStat = monthly[monthly.length - 1]
  if (lastStat) {
    const [statYear, statMonth] = lastStat.month.split('-').map(Number)
    if (statYear === currentYear && statMonth === currentMonth + 1) {
       spendingProjection = (lastStat.total / currentDay) * daysInMonth
    }
  }

  return {
    range,
    monthly,
    categories,
    spendingByDayOfWeek,
    monthlyComparison: {
      currentMonthTotal: currentMonthStat.total,
      previousMonthTotal: previousMonthStat.total,
      percentageChange,
    },
    purchaseFrequency: parseFloat(avgDays.toFixed(1)),
    spendingProjection: Math.round(spendingProjection),
    brandDistribution,
  }
}

export default { getAnalyticsOverview }