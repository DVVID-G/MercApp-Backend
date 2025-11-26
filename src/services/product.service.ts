import Product, { IProduct } from '../models/product.model'

export async function createProduct(data: Partial<IProduct>): Promise<IProduct> {
  const product = new Product(data)
  return product.save()
}

export async function findProductById(id: string): Promise<IProduct | null> {
  return Product.findById(id).exec()
}

export async function listProducts(): Promise<IProduct[]> {
  return Product.find().exec()
}
