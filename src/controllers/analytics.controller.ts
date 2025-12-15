import { Request, Response, NextFunction } from 'express'
import { AnalyticsQuerySchema } from '../validators/analytics.validator'
import * as analyticsService from '../services/analytics.service'

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const parsed = AnalyticsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() })
    }

    const data = await analyticsService.getAnalyticsOverview(userId, parsed.data)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
}

export default { getOverview }