import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder 50 caracteres').trim(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder 50 caracteres').trim().optional(),
  order: z.number().int().min(0, 'El orden debe ser un número positivo').optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

