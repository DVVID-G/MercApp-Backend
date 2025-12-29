import { Types } from 'mongoose';
import UserPreferences, { IUserPreferences } from '../models/user-preferences.model';

export async function getUserPreferences(userId: string): Promise<IUserPreferences | null> {
  return UserPreferences.findOne({ userId: new Types.ObjectId(userId) }).exec();
}

export async function getOrCreateUserPreferences(userId: string): Promise<IUserPreferences> {
  let preferences = await getUserPreferences(userId);
  
  if (!preferences) {
    preferences = await createDefaultPreferences(userId);
  }
  
  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Pick<IUserPreferences, 'theme' | 'language' | 'currencyDisplay' | 'dateFormat' | 'notifications'>>
): Promise<IUserPreferences> {
  const preferences = await UserPreferences.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  ).exec();
  
  if (!preferences) {
    // This shouldn't happen due to upsert, but TypeScript needs it
    return createDefaultPreferences(userId);
  }
  
  return preferences;
}

export async function createDefaultPreferences(userId: string): Promise<IUserPreferences> {
  const preferences = new UserPreferences({
    userId: new Types.ObjectId(userId),
    theme: 'system',
  });
  return preferences.save();
}

