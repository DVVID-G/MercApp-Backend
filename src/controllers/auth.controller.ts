import { Request, Response, NextFunction } from 'express';
import { signupSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';
import { loginSchema } from '../validators/login.validator';
import { parseDeviceInfo, extractIpAddress } from '../utils/device-parser';
import * as activityLogService from '../services/activity-log.service';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      // Friendly validation response
      const formatted = parseResult.error.format();
      const errors = Object.entries(formatted).map(([key, val]) => {
        const entry = val as any;
        return { field: key, messages: entry._errors || [] };
      });
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const { email, password } = parseResult.data;

    const user = await authService.verifyCredentials(email, password);
    if (!user) {
      // Log failed login attempt
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceInfo = parseDeviceInfo(userAgent);
      const ipAddress = extractIpAddress(req);
      
      await activityLogService.logLoginFailed({
        userId: null,
        deviceInfo,
        ipAddress,
        reason: 'invalid_credentials'
      });

      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const accessToken = authService.generateToken(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);
    await authService.saveRefreshToken(user.id, refreshToken);

    // Create session and log login
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = parseDeviceInfo(userAgent);
    const ipAddress = extractIpAddress(req);
    
    await authService.createSessionAndLogLogin(
      user.id,
      refreshToken,
      deviceInfo,
      ipAddress
    );

    return res.status(200).json({ accessToken, refreshToken, expiresIn: process.env.JWT_EXPIRES_IN || '24h', name: user.name, email: user.email });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('login error', err);
    return next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await authService.getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    return next(err);
  }
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      // Build a friendly list of field errors
      const formatted = parseResult.error.format();
      const errors: Array<{ field: string; messages: string[] }> = [];
      for (const key of Object.keys(formatted)) {
        const entry = (formatted as any)[key];
        if (entry && entry._errors && entry._errors.length) {
          errors.push({ field: key, messages: entry._errors });
        }
      }
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const { name, email, password } = parseResult.data;

    const existing = await authService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email ya registrado' });
    }

    const user = await authService.createUser(name, email, password);

    return res.status(201).json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('signup error', err);
    return next(err);
  }
}
