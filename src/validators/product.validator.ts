import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  price: z.number().nonnegative('El precio debe ser un número positivo'),
  gramaje: z.number().optional(),
  umd: z.string().optional(),
  barcode: z.string().optional(),
  categoria: z.string().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export default createProductSchema
