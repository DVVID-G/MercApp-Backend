import Session, { ISession, IDeviceInfo } from '../models/session.model';
import jwt from 'jsonwebtoken';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

interface CreateSessionParams {
  userId: string;
  refreshToken: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
}

/**
 * Create a new session record
 */
export async function createSession(params: CreateSessionParams): Promise<ISession> {
  // Calculate expiration date based on refresh token expiration
  const expiresInSeconds = parseExpiresIn(REFRESH_TOKEN_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const session = new Session({
    userId: params.userId,
    refreshToken: params.refreshToken,
    deviceInfo: params.deviceInfo,
    ipAddress: params.ipAddress,
    status: 'active',
    createdAt: new Date(),
    lastActivityAt: new Date(),
    expiresAt
  });

  return session.save();
}

/**
 * Find session by refresh token
 */
export async function findSessionByRefreshToken(refreshToken: string): Promise<ISession | null> {
  return Session.findOne({ 
    refreshToken, 
    status: 'active' 
  }).exec();
}

/**
 * Find session by ID
 */
export async function findSessionById(sessionId: string): Promise<ISession | null> {
  return Session.findById(sessionId).exec();
}

/**
 * Find all active sessions for a user
 */
export async function findActiveSessionsByUserId(userId: string): Promise<ISession[]> {
  return Session.find({ 
    userId, 
    status: 'active' 
  })
    .sort({ lastActivityAt: -1 })
    .exec();
}

/**
 * Update session last activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<ISession | null> {
  return Session.findByIdAndUpdate(
    sessionId,
    { lastActivityAt: new Date() },
    { new: true }
  ).exec();
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<ISession | null> {
  return Session.findByIdAndUpdate(
    sessionId,
    { status: 'revoked' },
    { new: true }
  ).exec();
}

/**
 * Revoke all active sessions for a user
 */
export async function revokeAllSessions(userId: string, excludeSessionId?: string): Promise<number> {
  const query: any = { userId, status: 'active' };
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const result = await Session.updateMany(
    query,
    { status: 'revoked' }
  ).exec();

  return result.modifiedCount;
}

/**
 * Clean up expired sessions (optional background job)
 * Note: MongoDB TTL index handles automatic cleanup, but this can be used for manual cleanup
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await Session.updateMany(
    { 
      status: 'active',
      expiresAt: { $lt: new Date() }
    },
    { status: 'expired' }
  ).exec();

  return result.modifiedCount;
}

/**
 * Create session retroactively for existing refresh token (migration scenario)
 */
export async function createSessionForRefreshToken(
  refreshToken: string,
  userId: string,
  deviceInfo: IDeviceInfo,
  ipAddress: string
): Promise<ISession | null> {
  try {
    // Verify token is valid
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET as any) as any;
    
    if (decoded.userId !== userId) {
      return null;
    }

    // Calculate expiration from token
    const expiresInSeconds = parseExpiresIn(REFRESH_TOKEN_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const session = new Session({
      userId,
      refreshToken,
      deviceInfo,
      ipAddress,
      status: 'active',
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt
    });

    return session.save();
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

/**
 * Parse expiresIn string to seconds
 * Supports formats like "7d", "24h", "3600s"
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) {
    // Default to 7 days if format is invalid
    return 7 * 24 * 60 * 60;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    case 's':
      return value;
    default:
      return 7 * 24 * 60 * 60;
  }
}

