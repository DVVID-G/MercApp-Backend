import { z } from 'zod'

const dateCoercer = z.preprocess((value) => {
  if (value instanceof Date) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
    return value
  }
  return value
}, z.date().optional())

export const AnalyticsQuerySchema = z
  .object({
    from: dateCoercer,
    to: dateCoercer,
  })
  .refine((data) => {
    if (data.from && data.to) {
      return data.from.getTime() <= data.to.getTime()
    }
    return true
  }, { message: 'Parameter "from" must be before "to"' })

export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>

export default AnalyticsQuerySchema