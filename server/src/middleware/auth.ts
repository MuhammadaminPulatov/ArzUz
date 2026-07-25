import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthUser {
  telegramId: string
  plan: 'free' | 'premium'
  isAdmin: boolean
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization']
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Missing token' })
    return
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as AuthUser
    ;(req as any).user = payload
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid token' })
  }
}
