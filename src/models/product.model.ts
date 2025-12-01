import mongoose, { Schema, Document } from 'mongoose'

/**
 * Interfaz del documento Product en MongoDB.
 */
export interface IProduct extends Document {
  name: string
  price: number
  gramaje?: number
  pum?: number
  umd?: string
  barcode?: string
  categoria?: string
  createdAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    gramaje: { type: Number },
    pum: { type: Number },
    umd: { type: String },
    barcode: { type: String, unique: true, sparse: true },
    categoria: { type: String, trim: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

/**
 * Hook pre-save que calcula automáticamente el PUM (precio por unidad de medida)
 * cuando `gramaje` y `price` están presentes y `price` > 0.
 */
ProductSchema.pre('save', function (next) {
  const doc = this as IProduct & Document
  if (doc.gramaje != null && doc.price != null && doc.price > 0) {
    doc.pum = doc.gramaje / doc.price
  }
  next()
})

const Product = mongoose.model<IProduct>('Product', ProductSchema)

export default Product
