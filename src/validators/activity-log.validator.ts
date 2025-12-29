import { z } from 'zod';

const dateCoercer = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return value; // Return original to trigger validation error
  }
  return value;
}, z.date().optional());

export const ActivityLogQuerySchema = z.object({
  eventType: z.enum(['login', 'logout', 'session_revoked', 'login_failed']).optional(),
  limit: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const num = typeof v === 'string' ? parseInt(v, 10) : v;
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().int().positive().max(200).optional().default(50)
  ),
  offset: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const num = typeof v === 'string' ? parseInt(v, 10) : v;
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().int().nonnegative().optional().default(0)
  ),
  startDate: dateCoercer,
  endDate: dateCoercer,
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.startDate.getTime() <= data.endDate.getTime();
  }
  return true;
}, { message: 'startDate must be before or equal to endDate' });

export type ActivityLogQueryInput = z.infer<typeof ActivityLogQuerySchema>;

