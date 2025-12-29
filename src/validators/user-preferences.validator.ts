import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().trim().optional(),
  currencyDisplay: z.enum(['COP', 'USD']).optional(),
  dateFormat: z.string().trim().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    purchaseReminders: z.boolean().optional(),
  }).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

