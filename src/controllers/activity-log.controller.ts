import { Request, Response, NextFunction } from 'express';
import * as activityLogService from '../services/activity-log.service';
import { ActivityLogQuerySchema } from '../validators/activity-log.validator';

/**
 * Get activity logs for the authenticated user
 */
export async function getActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const parsed = ActivityLogQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: parsed.error.format() 
      });
    }

    const result = await activityLogService.getUserActivityLogs({
      userId,
      eventType: parsed.data.eventType,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate
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

