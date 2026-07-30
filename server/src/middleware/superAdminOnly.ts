import { type Request, type Response, type NextFunction } from 'express'

export function superAdminOnly(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: { isSuperAdmin?: boolean } }).user
  if (!user?.isSuperAdmin) {
    res.status(403).json({ ok: false, error: 'Super admin ruxsati kerak' })
    return
  }
  next()
}
