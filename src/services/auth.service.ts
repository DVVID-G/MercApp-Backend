import bcrypt from 'bcrypt';
import User, { IUser } from '../models/user.model';
import jwt from 'jsonwebtoken';

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
