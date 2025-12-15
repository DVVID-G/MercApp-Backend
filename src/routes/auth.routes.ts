import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import * as refreshController from '../controllers/refresh.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10,
	message: { message: 'Too many login attempts, please try again later.' }
});

router.post('/signup', authController.signup);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', refreshController.refresh);
router.post('/logout', refreshController.logout);
router.get('/me', authMiddleware, authController.getMe);

export default router;
