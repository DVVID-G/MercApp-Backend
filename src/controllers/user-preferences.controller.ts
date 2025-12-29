import { Request, Response } from 'express';
import * as userPreferencesService from '../services/user-preferences.service';
import { updatePreferencesSchema } from '../validators/user-preferences.validator';

export async function getPreferences(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const preferences = await userPreferencesService.getOrCreateUserPreferences(userId);
    return res.status(200).json(preferences);
  } catch (err) {
    console.error('getPreferences error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const parseResult = updatePreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.format(),
      });
    }

    const preferences = await userPreferencesService.updateUserPreferences(userId, parseResult.data);
    return res.status(200).json(preferences);
  } catch (err) {
    console.error('updatePreferences error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

