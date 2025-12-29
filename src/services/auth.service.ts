import bcrypt from 'bcrypt';
import User, { IUser } from '../models/user.model';
import jwt from 'jsonwebtoken';
import * as sessionService from './session.service';
import * as activityLogService from './activity-log.service';
import { IDeviceInfo } from '../models/session.model';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) : 10;

export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email }).exec();
}

export async function createUser(name: string, email: string, password: string): Promise<IUser> {
  const passwordHash = await hashPassword(password);
  const user = new User({ name, email, passwordHash });
  return user.save();
}

export async function verifyCredentials(email: string, password: string): Promise<IUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  return match ? user : null;
}

export function generateToken(userId: string): string {
  // cast to any to satisfy types from jsonwebtoken in this small scaffold
  return jwt.sign({ userId }, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN as any } as any);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET as any, { expiresIn: REFRESH_TOKEN_EXPIRES_IN as any } as any);
}

export async function saveRefreshToken(userId: string, token: string): Promise<void> {
  await User.updateOne({ _id: userId }, { $addToSet: { refreshTokens: token } }).exec();
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await User.updateOne({ refreshTokens: token }, { $pull: { refreshTokens: token } }).exec();
}

export async function getUserById(userId: string): Promise<IUser | null> {
  return User.findById(userId).select('-passwordHash -refreshTokens').exec();
}

export async function findUserByRefreshToken(token: string): Promise<IUser | null> {
  return User.findOne({ refreshTokens: token }).exec();
}

/**
 * Create session and log login activity
 * This is called during login flow
 */
export async function createSessionAndLogLogin(
  userId: string,
  refreshToken: string,
  deviceInfo: IDeviceInfo,
  ipAddress: string
): Promise<string> {
  // Create session record
  const session = await sessionService.createSession({
    userId,
    refreshToken,
    deviceInfo,
    ipAddress
  });

  // Log login activity
  await activityLogService.logLogin({
    userId,
    sessionId: session._id.toString(),
    deviceInfo,
    ipAddress
  });

  return session._id.toString();
}

/**
 * Update session activity on token refresh
 */
export async function updateSessionOnRefresh(
  refreshToken: string
): Promise<void> {
  const session = await sessionService.findSessionByRefreshToken(refreshToken);
  if (session) {
    await sessionService.updateSessionActivity(session._id.toString());
  } else {
    // Migration scenario: create session retroactively if missing
    // This handles existing refresh tokens that don't have session records
    const user = await findUserByRefreshToken(refreshToken);
    if (user) {
      // We need deviceInfo and ipAddress, but they're not available here
      // This will be handled in the controller where we have access to request
      // For now, we'll skip retroactive creation in the service
    }
  }
}

/**
 * Revoke session and log logout activity
 */
export async function revokeSessionAndLogLogout(
  sessionId: string,
  userId: string,
  deviceInfo: IDeviceInfo,
  ipAddress: string,
  reason?: string
): Promise<void> {
  // Revoke session
  const session = await sessionService.revokeSession(sessionId);
  if (session) {
    // Revoke refresh token from user's array
    await revokeRefreshToken(session.refreshToken);
    
    // Log logout activity
    await activityLogService.logLogout({
      userId,
      sessionId,
      deviceInfo,
      ipAddress,
      reason
    });
  }
}

/**
 * Revoke all sessions and log activity
 */
export async function revokeAllSessionsAndLog(
  userId: string,
  deviceInfo: IDeviceInfo,
  ipAddress: string,
  excludeSessionId?: string
): Promise<number> {
  // Get sessions that will be revoked (for logging)
  const sessions = await sessionService.findActiveSessionsByUserId(userId);
  const sessionsToRevoke = excludeSessionId
    ? sessions.filter(s => s._id.toString() !== excludeSessionId)
    : sessions;

  // Revoke all sessions
  const revokedCount = await sessionService.revokeAllSessions(userId, excludeSessionId);

  // Revoke all refresh tokens from user's array
  const user = await User.findById(userId).exec();
  if (user && user.refreshTokens) {
    const tokensToRevoke = sessionsToRevoke.map(s => s.refreshToken);
    await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { $in: tokensToRevoke } } }
    ).exec();
  }

  // Log session revocation for each session
  for (const session of sessionsToRevoke) {
    await activityLogService.logSessionRevoked({
      userId,
      sessionId: session._id.toString(),
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      reason: 'user_initiated'
    });
  }

  return revokedCount;
}
