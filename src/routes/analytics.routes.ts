import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import * as analyticsController from '../controllers/analytics.controller'

const router = Router()

router.get('/', authMiddleware, analyticsController.getOverview)

export default router