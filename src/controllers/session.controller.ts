import { Request, Response, NextFunction } from 'express';
import * as sessionService from '../services/session.service';
import * as authService from '../services/auth.service';
import { parseDeviceInfo, extractIpAddress } from '../utils/device-parser';

/**
 * List all active sessions for the authenticated user
 */
export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sessions = await sessionService.findActiveSessionsByUserId(userId);

    const sessionsResponse = sessions.map(session => ({
      id: session._id.toString(),
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      status: session.status,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isCurrent: false // TODO: Implement current session detection
    }));

    return res.status(200).json({ sessions: sessionsResponse });
  } catch (err) {
    return next(err);
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const session = await sessionService.findSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify session belongs to user
    if (session.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = parseDeviceInfo(userAgent);
    const ipAddress = extractIpAddress(req);

    await authService.revokeSessionAndLogLogout(
      sessionId,
      userId,
      deviceInfo,
      ipAddress,
      'user_initiated'
    );

    return res.status(200).json({ message: 'Session revoked' });
  } catch (err) {
    return next(err);
  }
}

/**
 * Revoke all sessions for the authenticated user
 */
export async function revokeAllSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { excludeCurrent } = req.query;
    const excludeSessionId = excludeCurrent === 'true' ? undefined : undefined; // TODO: Implement current session exclusion

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = parseDeviceInfo(userAgent);
    const ipAddress = extractIpAddress(req);

    const revokedCount = await authService.revokeAllSessionsAndLog(
      userId,
      deviceInfo,
      ipAddress,
      excludeSessionId
    );

    return res.status(200).json({ 
      message: 'All sessions revoked', 
      revokedCount 
    });
  } catch (err) {
    return next(err);
  }
}

