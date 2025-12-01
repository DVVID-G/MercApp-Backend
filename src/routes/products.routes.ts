import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import * as productController from '../controllers/product.controller'

const router = Router()

router.post('/', authMiddleware, productController.createProduct)
router.get('/', productController.listProducts)
router.get('/barcode/:barcode', productController.getProductByBarcode)

export default router
