import { Request, Response } from 'express';
import { signupSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';
import { loginSchema } from '../validators/login.validator';

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ errors: parseResult.error.format() });
    }

    const { email, password } = parseResult.data;

    const user = await authService.verifyCredentials(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = authService.generateToken(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);
    await authService.saveRefreshToken(user.id, refreshToken);

    return res.status(200).json({ token, refreshToken, expiresIn: process.env.JWT_EXPIRES_IN || '24h', name: user.name, email: user.email });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('login error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ errors: parseResult.error.format() });
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
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
