import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.service';
import * as sessionService from '../services/session.service';
import { parseDeviceInfo, extractIpAddress } from '../utils/device-parser';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET as any) as any;
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await authService.findUserByRefreshToken(refreshToken);
    if (!user) return res.status(401).json({ message: 'Refresh token not found' });

    // Find or create session for this refresh token
    let session = await sessionService.findSessionByRefreshToken(refreshToken);
    
    // Migration scenario: create session retroactively if missing
    if (!session) {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceInfo = parseDeviceInfo(userAgent);
      const ipAddress = extractIpAddress(req);
      
      session = await sessionService.createSessionForRefreshToken(
        refreshToken,
        user.id,
        deviceInfo,
        ipAddress
      );
    }

    // Update session activity on refresh
    await authService.updateSessionOnRefresh(refreshToken);

    // rotate refresh token: revoke old, issue new
    await authService.revokeRefreshToken(refreshToken);
    const newRefresh = authService.generateRefreshToken(user.id);
    await authService.saveRefreshToken(user.id, newRefresh);

    // Update session with new refresh token if session exists
    if (session) {
      session.refreshToken = newRefresh;
      await session.save();
    }

    const accessToken = authService.generateToken(user.id);
    return res.status(200).json({ accessToken, refreshToken: newRefresh, expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('refresh error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken, sessionId, all } = req.body;
    const userId = (req as any).userId; // May be undefined for legacy logout

    // Support "logout all devices"
    if (all === true) {
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required for logout all' });
      }

      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceInfo = parseDeviceInfo(userAgent);
      const ipAddress = extractIpAddress(req);

      const revokedCount = await authService.revokeAllSessionsAndLog(
        userId,
        deviceInfo,
        ipAddress
      );

      return res.status(200).json({ 
        message: 'All sessions revoked', 
        revokedCount 
      });
    }

    // Support session-specific logout
    if (sessionId) {
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
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
    }

    // Legacy: logout with refreshToken (backward compatible)
    if (refreshToken) {
      const session = await sessionService.findSessionByRefreshToken(refreshToken);
      
      if (session) {
        // New flow: use session
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const deviceInfo = parseDeviceInfo(userAgent);
        const ipAddress = extractIpAddress(req);

        await authService.revokeSessionAndLogLogout(
          session._id.toString(),
          session.userId,
          deviceInfo,
          ipAddress,
          'user_initiated'
        );
      } else {
        // Legacy flow: just revoke token
        await authService.revokeRefreshToken(refreshToken);
      }

      return res.status(200).json({ message: 'Logged out' });
    }

    return res.status(400).json({ message: 'refreshToken, sessionId, or all parameter is required' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('logout error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
