import mongoose, { Schema, Document } from 'mongoose'

export interface IPurchaseItem {
  productId?: string
  name: string
  marca: string
  price: number
  quantity: number
  packageSize: number
  pum?: number
  umd: string
  barcode: string
  categoria: string
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
  marca: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  packageSize: { type: Number, required: true },
  pum: { type: Number },
  umd: { type: String, required: true },
  barcode: { type: String, required: true },
  categoria: { type: String, required: true },
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
