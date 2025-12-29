import ActivityLog, { IActivityLog, IDeviceInfo } from '../models/activity-log.model';

interface LogLoginParams {
  userId: string;
  sessionId?: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
}

interface LogLogoutParams {
  userId: string;
  sessionId?: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  reason?: string;
}

interface LogSessionRevokedParams {
  userId: string;
  sessionId: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  reason?: string;
}

interface LogLoginFailedParams {
  userId: string | null;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  reason?: string;
  metadata?: Record<string, any>;
}

interface GetActivityLogsParams {
  userId: string;
  eventType?: 'login' | 'logout' | 'session_revoked' | 'login_failed';
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Log a successful login event
 */
export async function logLogin(params: LogLoginParams): Promise<IActivityLog> {
  const log = new ActivityLog({
    userId: params.userId,
    eventType: 'login',
    sessionId: params.sessionId,
    deviceInfo: params.deviceInfo,
    ipAddress: params.ipAddress,
    success: true,
    createdAt: new Date()
  });

  return log.save();
}

/**
 * Log a logout event
 */
export async function logLogout(params: LogLogoutParams): Promise<IActivityLog> {
  const log = new ActivityLog({
    userId: params.userId,
    eventType: 'logout',
    sessionId: params.sessionId,
    deviceInfo: params.deviceInfo,
    ipAddress: params.ipAddress,
    success: true,
    reason: params.reason || 'user_initiated',
    createdAt: new Date()
  });

  return log.save();
}

/**
 * Log a session revocation event
 */
export async function logSessionRevoked(params: LogSessionRevokedParams): Promise<IActivityLog> {
  const log = new ActivityLog({
    userId: params.userId,
    eventType: 'session_revoked',
    sessionId: params.sessionId,
    deviceInfo: params.deviceInfo,
    ipAddress: params.ipAddress,
    success: true,
    reason: params.reason || 'user_initiated',
    createdAt: new Date()
  });

  return log.save();
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailed(params: LogLoginFailedParams): Promise<IActivityLog> {
  const log = new ActivityLog({
    userId: params.userId,
    eventType: 'login_failed',
    deviceInfo: params.deviceInfo,
    ipAddress: params.ipAddress,
    success: false,
    reason: params.reason || 'invalid_credentials',
    metadata: params.metadata,
    createdAt: new Date()
  });

  return log.save();
}

/**
 * Retrieve activity logs for a user with pagination and filtering
 */
export async function getUserActivityLogs(params: GetActivityLogsParams): Promise<{
  logs: IActivityLog[];
  total: number;
  limit: number;
  offset: number;
}> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  // Build query
  const query: any = { userId: params.userId };

  if (params.eventType) {
    query.eventType = params.eventType;
  }

  if (params.startDate || params.endDate) {
    query.createdAt = {};
    if (params.startDate) {
      query.createdAt.$gte = params.startDate;
    }
    if (params.endDate) {
      query.createdAt.$lte = params.endDate;
    }
  }

  // Get total count
  const total = await ActivityLog.countDocuments(query).exec();

  // Get paginated results
  const logs = await ActivityLog.find(query)
    .sort({ createdAt: -1 }) // Most recent first
    .limit(limit)
    .skip(offset)
    .exec();

  return {
    logs,
    total,
    limit,
    offset
  };
}

