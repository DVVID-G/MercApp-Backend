import { z } from 'zod'

const PurchaseItemBase = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  marca: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1),
  packageSize: z.number().positive(),
  pum: z.number().optional(),
  umd: z.string().min(1),
  barcode: z.string().min(1),
  categoria: z.string().min(1),
})

// Todos los campos son requeridos para auto-sync al catálogo
export const PurchaseItemSchema = PurchaseItemBase

export const CreatePurchaseSchema = z.object({
  items: z.array(PurchaseItemSchema).min(1),
})

export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>

export default CreatePurchaseSchema

export const ListPurchasesQuery = z.object({
  page: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().positive().optional()),
  limit: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().positive().max(100).optional()),
  sort: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type ListPurchasesQueryInput = z.infer<typeof ListPurchasesQuery>
