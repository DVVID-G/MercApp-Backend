import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import * as refreshController from '../controllers/refresh.controller';
import * as sessionController from '../controllers/session.controller';
import * as activityLogController from '../controllers/activity-log.controller';
import * as userPreferencesController from '../controllers/user-preferences.controller';
import * as userAccountController from '../controllers/user-account.controller';
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

// Session management routes
router.get('/sessions', authMiddleware, sessionController.listSessions);
router.delete('/sessions/:sessionId', authMiddleware, sessionController.revokeSession);
router.delete('/sessions', authMiddleware, sessionController.revokeAllSessions);

// Activity log routes
router.get('/activity-logs', authMiddleware, activityLogController.getActivityLogs);

// User preferences routes
router.get('/preferences', authMiddleware, userPreferencesController.getPreferences);
router.put('/preferences', authMiddleware, userPreferencesController.updatePreferences);

// Account management routes
router.put('/me', authMiddleware, userAccountController.updateAccount);
router.put('/password', authMiddleware, userAccountController.changePassword);

export default router;
