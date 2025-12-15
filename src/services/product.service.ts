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

/**
 * Busca un producto por nombre, marca y unidad de medida (case-insensitive).
 * @param name Nombre del producto.
 * @param marca Marca del producto.
 * @param umd Unidad de medida del producto.
 */
export async function findByNameBrandUmd(
  name: string,
  marca: string,
  umd: string
): Promise<IProduct | null> {
  return Product.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    marca: { $regex: new RegExp(`^${marca}$`, 'i') },
    umd: { $regex: new RegExp(`^${umd}$`, 'i') },
  }).exec()
}

/**
 * Busca o crea un producto basándose en un item de compra.
 * Lógica de búsqueda:
 * 1. Si tiene barcode, buscar por barcode (prioridad)
 * 2. Si no existe, buscar por nombre + marca + umd
 * 3. Si no existe, crear nuevo producto
 * 
 * @param item Datos del producto del item de compra.
 * @returns { product, created, priceChanged }
 */
export async function findOrCreateFromPurchaseItem(item: {
  name: string
  marca: string
  price: number
  packageSize: number
  umd: string
  barcode: string
  categoria: string
}): Promise<{ product: IProduct; created: boolean; priceChanged: boolean }> {
  // 1. Buscar por barcode (prioridad)
  let product = await findByBarcode(item.barcode)

  if (product) {
    // Producto existe, verificar si el precio cambió
    const priceChanged = Math.abs(product.price - item.price) > 0.01
    return { product, created: false, priceChanged }
  }

  // 2. Buscar por nombre + marca + umd
  product = await findByNameBrandUmd(item.name, item.marca, item.umd)

  if (product) {
    // Producto existe con diferentes datos, verificar precio
    const priceChanged = Math.abs(product.price - item.price) > 0.01
    return { product, created: false, priceChanged }
  }

  // 3. Crear nuevo producto
  product = await createProduct({
    name: item.name,
    marca: item.marca,
    price: item.price,
    packageSize: item.packageSize,
    umd: item.umd,
    barcode: item.barcode,
    categoria: item.categoria,
  })

  return { product, created: true, priceChanged: false }
}

/**
 * Busca productos por nombre (texto) con límite.
 * Usa el índice de texto para búsqueda eficiente.
 * @param query Término de búsqueda.
 * @param limit Número máximo de resultados (default: 10).
 */
export async function searchByName(query: string, limit: number = 10): Promise<IProduct[]> {
  return Product.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .exec()
}

/**
 * Actualiza un producto por su ID.
 * @param id ID del producto a actualizar.
 * @param updates Campos a actualizar.
 */
export async function updateProduct(
  id: string,
  updates: Partial<IProduct>
): Promise<IProduct | null> {
  return Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).exec()
}
