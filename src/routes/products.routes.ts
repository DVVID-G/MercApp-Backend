import { Router } from 'express'
import * as productController from '../controllers/product.controller'

const router = Router()

router.post('/', productController.createProduct)
router.get('/', productController.listProducts)

export default router
