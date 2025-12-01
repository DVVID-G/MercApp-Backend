import { z } from 'zod'

const PurchaseItemBase = z.object({
  productId: z.string().optional(),
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().min(1),
  umd: z.string().optional(),
})

// If productId is not provided, name and price are required.
export const PurchaseItemSchema = PurchaseItemBase.refine(
  (item) => {
    if (item.productId) return true
    return !!item.name && typeof item.price === 'number'
  },
  { message: 'Either productId or both name and price are required' }
)

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
