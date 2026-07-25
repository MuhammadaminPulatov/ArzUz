import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { adminOnly } from '../middleware/adminOnly'
import { Ticket } from '../models/ticket.model'
import { sseService } from '../services/sseService'

export const adminRouter = Router()
adminRouter.use(authMiddleware, adminOnly)

// GET /api/admin/tickets
adminRouter.get('/tickets', async (req: Request, res: Response) => {
  const page     = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10))
  const limit    = Math.min(100, parseInt(String(req.query['limit'] ?? '50'), 10))
  const status   = req.query['status'] as string | undefined
  const district = req.query['district'] as string | undefined
  const priority = req.query['priority'] as string | undefined

  const filter: Record<string, unknown> = {}
  if (status)   filter['status'] = status
  if (district) filter['district'] = district
  if (priority) filter['priority'] = priority

  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort({ priority: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Ticket.countDocuments(filter),
  ])

  res.json({ ok: true, data: { tickets, total, page, limit } })
})

// GET /api/admin/analytics
adminRouter.get('/analytics', async (_req: Request, res: Response) => {
  const [total, byStatusRaw, avgArr] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
      { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
      { $group: { _id: null, avg: { $avg: '$diff' } } },
    ]),
  ])

  const byStatus: Record<string, number> = {}
  for (const row of byStatusRaw) byStatus[row._id as string] = row.count as number

  const avgMs = (avgArr[0]?.avg as number | undefined) ?? 0

  res.json({
    ok: true,
    data: {
      total,
      byStatus,
      avgResolutionDays: Math.round(avgMs / 86400000),
    },
  })
})

// PATCH /api/admin/tickets/:id
adminRouter.patch('/tickets/:id', async (req: Request, res: Response) => {
  const allowed = ['status', 'aiTitle', 'aiDescription', 'department', 'severity', 'priority', 'channelMessageId']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if ((req.body as Record<string, unknown>)[key] !== undefined) {
      update[key] = (req.body as Record<string, unknown>)[key]
    }
  }
  if (update['status'] === 'resolved') update['resolvedAt'] = new Date()

  const ticket = await Ticket.findByIdAndUpdate(req.params['id'], { $set: update }, { new: true })
  if (!ticket) {
    res.status(404).json({ ok: false, error: 'Ticket not found' })
    return
  }

  if (update['status']) sseService.ticketUpdated(req.params['id']!, { status: update['status'] })
  res.json({ ok: true, data: ticket })
})
