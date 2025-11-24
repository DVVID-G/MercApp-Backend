import mongoose, { Schema, Document } from 'mongoose'

export interface IPurchaseItem {
  productId?: string
  name: string
  price: number
  quantity: number
  umd?: string
}

export interface IPurchase extends Document {
  userId: string
  items: IPurchaseItem[]
  total: number
  createdAt: Date
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  productId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  umd: { type: String },
})

const PurchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: String, required: true, index: true },
    items: { type: [PurchaseItemSchema], required: true },
    total: { type: Number, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

const Purchase = mongoose.model<IPurchase>('Purchase', PurchaseSchema)

export default Purchase
