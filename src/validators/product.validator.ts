import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  marca: z.string().min(1, 'La marca es obligatoria'),
  price: z.number().nonnegative('El precio debe ser un número positivo'),
  packageSize: z.number().positive('El tamaño del paquete debe ser un número positivo'),
  umd: z.string().min(1, 'La unidad de medida es obligatoria'),
  barcode: z.string().min(1, 'El código de barras es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  marca: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  packageSize: z.number().positive().optional(),
  umd: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
})

export const searchProductSchema = z.object({
  q: z.string().min(1, 'El término de búsqueda es obligatorio'),
  limit: z.number().int().positive().max(50).optional().default(10),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type SearchProductInput = z.infer<typeof searchProductSchema>

export default createProductSchema
