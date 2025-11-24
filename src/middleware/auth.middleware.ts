import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string }
    ;(req as any).userId = payload.userId
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export default authMiddleware
