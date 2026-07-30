import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface OrgJwtPayload {
  orgId: string
  name: string
  shortName: string
  icon: string
  category: string
}

export function orgAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Org token required' })
    return
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, env.jwtSecret) as OrgJwtPayload
    if (!payload.orgId) {
      res.status(401).json({ ok: false, error: 'Invalid org token' })
      return
    }
    ;(req as Request & { org: OrgJwtPayload }).org = payload
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid or expired token' })
  }
}
