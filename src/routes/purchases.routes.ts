import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import * as purchaseController from '../controllers/purchase.controller'

const router = Router()

router.post('/', authMiddleware, purchaseController.createPurchase)
router.get('/', authMiddleware, purchaseController.listPurchases)
router.get('/:id', authMiddleware, purchaseController.getPurchaseById)

export default router
