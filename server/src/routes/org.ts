import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { Organization } from '../models/organization.model'
import { Ticket } from '../models/ticket.model'
import { orgAuthMiddleware, type OrgJwtPayload } from '../middleware/orgAuth'

export const orgRouter = Router()

// POST /api/org/auth/login
orgRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) {
    res.status(400).json({ ok: false, error: 'username va password kerak' })
    return
  }

  const org = await Organization.findOne({ username })
  if (!org) {
    res.status(401).json({ ok: false, error: "Noto'g'ri username yoki parol" })
    return
  }

  const ok = await bcrypt.compare(password, org.passwordHash)
  if (!ok) {
    res.status(401).json({ ok: false, error: "Noto'g'ri username yoki parol" })
    return
  }

  const payload: OrgJwtPayload = {
    orgId:     org.orgId,
    name:      org.name,
    shortName: org.shortName,
    icon:      org.icon,
    category:  org.category,
  }

  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' })

  res.json({
    ok: true,
    data: {
      token,
      org: {
        orgId:     org.orgId,
        name:      org.name,
        shortName: org.shortName,
        icon:      org.icon,
        category:  org.category,
        district:  org.district,
        phone:     org.phone,
      },
    },
  })
})

// GET /api/org/tickets
orgRouter.get('/tickets', orgAuthMiddleware, async (req: Request, res: Response) => {
  const { orgId } = (req as Request & { org: OrgJwtPayload }).org
  const page  = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10))
  const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10))
  const statusFilter = req.query['status'] as string | undefined

  const filter: Record<string, unknown> = { assignedOrgId: orgId }
  if (statusFilter && statusFilter !== 'all') filter['status'] = statusFilter

  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Ticket.countDocuments(filter),
  ])

  res.json({ ok: true, data: { tickets, total, page, limit } })
})

// PATCH /api/org/tickets/:id/status
orgRouter.patch('/tickets/:id/status', orgAuthMiddleware, async (req: Request, res: Response) => {
  const { orgId } = (req as Request & { org: OrgJwtPayload }).org
  const { status } = req.body as { status?: string }

  const allowed = ['in_progress', 'resolved']
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ ok: false, error: `Status: ${allowed.join(' yoki ')}` })
    return
  }

  const update: Record<string, unknown> = { status }
  if (status === 'resolved') update['resolvedAt'] = new Date()

  const ticket = await Ticket.findOneAndUpdate(
    { _id: req.params['id'], assignedOrgId: orgId },
    { $set: update },
    { new: true },
  )

  if (!ticket) {
    res.status(404).json({ ok: false, error: 'Ariza topilmadi yoki sizga tayinlanmagan' })
    return
  }

  res.json({ ok: true, data: ticket })
})

// GET /api/org/stats
orgRouter.get('/stats', orgAuthMiddleware, async (req: Request, res: Response) => {
  const { orgId } = (req as Request & { org: OrgJwtPayload }).org

  const [total, byStatusRaw] = await Promise.all([
    Ticket.countDocuments({ assignedOrgId: orgId }),
    Ticket.aggregate([
      { $match: { assignedOrgId: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ])

  const byStatus: Record<string, number> = {}
  for (const row of byStatusRaw) byStatus[row._id as string] = row.count as number

  res.json({
    ok: true,
    data: {
      total,
      inProgress: byStatus['in_progress'] ?? 0,
      resolved:   byStatus['resolved'] ?? 0,
      pending:    (byStatus['new'] ?? 0) + (byStatus['sent'] ?? 0),
    },
  })
})
