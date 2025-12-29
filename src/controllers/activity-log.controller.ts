import { Request, Response, NextFunction } from 'express';
import * as activityLogService from '../services/activity-log.service';

/**
 * Get activity logs for the authenticated user
 */
export async function getActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const eventType = req.query.eventType as 'login' | 'logout' | 'session_revoked' | 'login_failed' | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await activityLogService.getUserActivityLogs({
      userId,
      eventType,
      limit,
      offset,
      startDate,
      endDate
    });

    const logsResponse = result.logs.map(log => ({
      id: log._id.toString(),
      eventType: log.eventType,
      sessionId: log.sessionId,
      deviceInfo: log.deviceInfo,
      ipAddress: log.ipAddress,
      success: log.success,
      reason: log.reason,
      metadata: log.metadata,
      createdAt: log.createdAt
    }));

    return res.status(200).json({
      logs: logsResponse,
      total: result.total,
      limit: result.limit,
      offset: result.offset
    });
  } catch (err) {
    return next(err);
  }
}

