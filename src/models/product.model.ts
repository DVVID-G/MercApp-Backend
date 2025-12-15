import mongoose, { Schema, Document } from 'mongoose'

/**
 * Interfaz del documento Product en MongoDB.
 */
export interface IProduct extends Document {
  name: string
  marca: string
  price: number
  packageSize: number
  pum?: number
  umd: string
  barcode: string
  categoria: string
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    marca: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    packageSize: { type: Number, required: true },
    pum: { type: Number },
    umd: { type: String, required: true },
    barcode: { type: String, required: true, unique: true },
    categoria: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

// Índice compuesto para búsqueda por nombre + marca + UMD (case-insensitive)
ProductSchema.index({ name: 1, marca: 1, umd: 1 })

// Índice de texto para búsqueda por nombre
ProductSchema.index({ name: 'text' })

/**
 * Hook pre-save que calcula automáticamente el PUM (precio por unidad de medida)
 * cuando `packageSize` y `price` están presentes, y ambos son > 0.
 * Formula: PUM = price / packageSize
 */
ProductSchema.pre('save', function (next) {
  const doc = this as IProduct & Document
  if (doc.packageSize != null && doc.price != null && doc.packageSize > 0 && doc.price > 0) {
    doc.pum = doc.price / doc.packageSize
  }
  next()
})

const Product = mongoose.model<IProduct>('Product', ProductSchema)

export default Product
