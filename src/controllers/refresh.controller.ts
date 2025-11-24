import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.service';

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

    // rotate refresh token: revoke old, issue new
    await authService.revokeRefreshToken(refreshToken);
    const newRefresh = authService.generateRefreshToken(user.id);
    await authService.saveRefreshToken(user.id, newRefresh);

    const accessToken = authService.generateToken(user.id);
    return res.status(200).json({ token: accessToken, refreshToken: newRefresh, expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('refresh error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });

    await authService.revokeRefreshToken(refreshToken);
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('logout error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
