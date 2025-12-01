import Product, { IProduct } from '../models/product.model'

/**
 * Crea y persiste un producto.
 * @param data Campos parciales del producto.
 */
export async function createProduct(data: Partial<IProduct>): Promise<IProduct> {
  const product = new Product(data)
  return product.save()
}

/**
 * Busca un producto por su id de Mongo.
 * @param id Identificador del producto.
 */
export async function findProductById(id: string): Promise<IProduct | null> {
  return Product.findById(id).exec()
}

/**
 * Lista todos los productos.
 */
export async function listProducts(): Promise<IProduct[]> {
  return Product.find().exec()
}

/**
 * Busca un producto por su código de barras.
 * @param barcode Código de barras a buscar.
 */
export async function findByBarcode(barcode: string): Promise<IProduct | null> {
  return Product.findOne({ barcode }).exec()
}
