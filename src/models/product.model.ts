import mongoose, { Schema, Document } from 'mongoose'

/**
 * Tipo de producto: regular (con código de barras) o fruver (peso variable)
 */
export type ProductType = 'regular' | 'fruver'

/**
 * Interfaz del documento Product en MongoDB.
 */
export interface IProduct extends Document {
  name: string
  marca: string
  productType: ProductType
  // Campos condicionales (regular)
  price?: number
  packageSize?: number
  barcode?: string
  // Campos condicionales (fruver)
  referencePrice?: number
  referenceWeight?: number
  // Campos comunes
  pum?: number
  umd: string
  categoria: string
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    marca: { type: String, required: true, trim: true },
    productType: { 
      type: String, 
      required: true, 
      enum: ['regular', 'fruver'],
      default: 'regular'
    },
    // Campos condicionales (regular)
    price: { type: Number },
    packageSize: { type: Number },
    barcode: { type: String, trim: true },
    // Campos condicionales (fruver)
    referencePrice: { type: Number },
    referenceWeight: { type: Number },
    // Campos comunes
    pum: { type: Number },
    umd: { type: String, required: true },
    categoria: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

// Índice compuesto para búsqueda por nombre + marca + UMD (case-insensitive)
ProductSchema.index({ name: 1, marca: 1, umd: 1 })

// Índice de texto para búsqueda por nombre
ProductSchema.index({ name: 'text' })

// Índice parcial único para barcode (solo si es de tipo string)
ProductSchema.index(
  { barcode: 1 },
  { 
    unique: true,
    partialFilterExpression: { barcode: { $type: 'string' } }
  }
)

/**
 * Hook pre-save que calcula automáticamente el PUM (precio por unidad de medida)
 * según el tipo de producto:
 * - Regular: PUM = price / packageSize
 * - Fruver: PUM = referencePrice / referenceWeight (por gramo)
 */
ProductSchema.pre('save', function (next) {
  const doc = this as IProduct & Document
  
  if (doc.productType === 'regular') {
    // Regular: PUM = price / packageSize
    if (doc.packageSize != null && doc.price != null && doc.packageSize > 0 && doc.price > 0) {
      doc.pum = Math.round((doc.price / doc.packageSize) * 100) / 100
    }
  } else if (doc.productType === 'fruver') {
    // Fruver: PUM = referencePrice / referenceWeight (por gramo)
    if (doc.referenceWeight != null && doc.referencePrice != null && doc.referenceWeight > 0 && doc.referencePrice > 0) {
      doc.pum = Math.round((doc.referencePrice / doc.referenceWeight) * 100) / 100
    }
  }
  
  next()
})

const Product = mongoose.model<IProduct>('Product', ProductSchema)

export default Product
