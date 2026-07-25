import type { Request, Response, NextFunction } from 'express'

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ ok: false, error: 'Admin only' })
    return
  }
  next()
}
