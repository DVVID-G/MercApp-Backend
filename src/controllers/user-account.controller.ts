import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { updateAccountSchema, changePasswordSchema } from '../validators/user-account.validator';

export async function updateAccount(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const parseResult = updateAccountSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.format(),
      });
    }

    try {
      const user = await authService.updateUserInfo(userId, parseResult.data);
      return res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
      });
    } catch (err: any) {
      if (err.message === 'Email already in use') {
        return res.status(409).json({ message: 'El email ya está en uso' });
      }
      if (err.message === 'User not found') {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      throw err;
    }
  } catch (err) {
    console.error('updateAccount error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.format(),
      });
    }

    try {
      await authService.changePassword(
        userId,
        parseResult.data.currentPassword,
        parseResult.data.newPassword
      );
      return res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
    } catch (err: any) {
      if (err.message === 'Current password is incorrect') {
        return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      }
      if (err.message === 'New password must be different from current password') {
        return res.status(400).json({ message: 'La nueva contraseña debe ser diferente de la actual' });
      }
      if (err.message === 'User not found') {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      throw err;
    }
  } catch (err) {
    console.error('changePassword error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

