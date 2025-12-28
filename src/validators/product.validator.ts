import { z } from 'zod'

// Base común para todos los productos
const productBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200).trim(),
  marca: z.string().min(1, 'La marca es obligatoria').max(100).trim(),
  categoria: z.string().min(1, 'La categoría es obligatoria').max(100).trim(),
  umd: z.string().min(1, 'La unidad de medida es obligatoria'),
})

// Schema para producto regular
const productRegularSchema = productBaseSchema.extend({
  productType: z.literal('regular'),
  barcode: z.string().min(8, 'El código de barras debe tener al menos 8 caracteres').max(20),
  price: z.number().positive('El precio debe ser un número positivo').max(1_000_000_000),
  packageSize: z.number().positive('El tamaño del paquete debe ser un número positivo').max(100_000),
})

// Schema para producto fruver
const productFruverSchema = productBaseSchema.extend({
  productType: z.literal('fruver'),
  barcode: z.string().min(8).max(20).optional(),
  referencePrice: z.number().positive('El precio de referencia debe ser un número positivo').max(1_000_000_000),
  referenceWeight: z.number().positive('El peso de referencia debe ser un número positivo').max(100_000),
  umd: z.enum(['g', 'kg'], { errorMap: () => ({ message: 'La unidad de medida debe ser "g" o "kg"' }) }),
})

// Discriminated union por productType
export const createProductSchema = z.discriminatedUnion('productType', [
  productRegularSchema,
  productFruverSchema,
])

// Schema para actualización (no permite cambiar productType)
export const updateProductSchema = z.union([
  productRegularSchema.partial().omit({ productType: true }),
  productFruverSchema.partial().omit({ productType: true }),
]).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
})

export const searchProductSchema = z.object({
  q: z.string().min(1, 'El término de búsqueda es obligatorio'),
  limit: z.number().int().positive().max(200).optional().default(10),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type SearchProductInput = z.infer<typeof searchProductSchema>

export default createProductSchema
