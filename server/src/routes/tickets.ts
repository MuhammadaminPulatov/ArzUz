import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { authMiddleware } from '../middleware/auth'
import { adminOnly } from '../middleware/adminOnly'
import { Ticket } from '../models/ticket.model'
import { User } from '../models/user.model'
import { Counter } from '../models/counter.model'
import { sseService } from '../services/sseService'

export const ticketsRouter = Router()

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.telegramId ?? req.ip ?? 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many tickets, try again later' },
  skip: () => process.env['NODE_ENV'] === 'test',
})

// GET /api/tickets
ticketsRouter.get('/', async (req: Request, res: Response) => {
  const page     = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10))
  const limit    = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10))
  const category = req.query['category'] as string | undefined
  const district = req.query['district'] as string | undefined
  const status   = req.query['status'] as string | undefined

  const filter: Record<string, unknown> = {}
  if (category) filter['category'] = category
  if (district) filter['district'] = district
  if (status)   filter['status'] = status

  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Ticket.countDocuments(filter),
  ])

  res.json({ ok: true, data: { tickets, total, page, limit } })
})

// GET /api/tickets/:id
ticketsRouter.get('/:id', async (req: Request, res: Response) => {
  const ticket = await Ticket.findById(req.params['id'])
  if (!ticket) {
    res.status(404).json({ ok: false, error: 'Ticket not found' })
    return
  }
  res.json({ ok: true, data: ticket })
})

// POST /api/tickets
ticketsRouter.post('/', authMiddleware, createLimiter, async (req: Request, res: Response) => {
  const user = req.user!
  const body = req.body as {
    photoUrl: string
    photoThumbnailUrl: string
    category: string
    categoryLabel: string
    severity?: string
    aiTitle?: string
    aiDescription?: string
    department?: string
    aiConfidence?: number
    lat: number
    lng: number
    address: string
    district?: string
    userNote?: string
  }

  if (!body.photoUrl || !body.lat || !body.lng || !body.address) {
    res.status(400).json({ ok: false, error: 'Missing required fields' })
    return
  }

  const ticketId = await Counter.nextTicketId()
  const dbUser = await User.findOne({ telegramId: user.telegramId }).lean()
  const username  = dbUser?.username  ?? 'anonymous'
  const firstName = dbUser?.firstName ?? 'User'

  const ticket = await Ticket.create({
    ticketId,
    userId: user.telegramId,
    username,
    firstName,
    photoUrl:          body.photoUrl,
    photoThumbnailUrl: body.photoThumbnailUrl,
    category:          body.category,
    categoryLabel:     body.categoryLabel,
    severity:          body.severity ?? 'medium',
    aiTitle:           body.aiTitle ?? '',
    aiDescription:     body.aiDescription ?? '',
    department:        body.department ?? '',
    aiConfidence:      body.aiConfidence ?? 0,
    lat:               body.lat,
    lng:               body.lng,
    address:           body.address,
    district:          body.district ?? '',
    userNote:          body.userNote ?? '',
  })

  await User.updateOne({ telegramId: user.telegramId }, { $inc: { reportCount: 1, xp: 50 } })
  sseService.ticketCreated(ticket.toObject())

  res.status(201).json({ ok: true, data: ticket })
})

// POST /api/tickets/:id/vote
ticketsRouter.post('/:id/vote', authMiddleware, async (req: Request, res: Response) => {
  const user = req.user!
  const existing = await Ticket.findById(req.params['id'])
  if (!existing) {
    res.status(404).json({ ok: false, error: 'Ticket not found' })
    return
  }
  if (existing.voterIds.includes(user.telegramId)) {
    res.status(409).json({ ok: false, error: 'Already voted' })
    return
  }

  const updated = await Ticket.findByIdAndUpdate(
    req.params['id'],
    { $inc: { votes: 1 }, $push: { voterIds: user.telegramId } },
    { new: true },
  )

  sseService.ticketVoted(req.params['id']!, updated!.votes)
  res.json({ ok: true, data: { votes: updated!.votes } })
})

// PATCH /api/tickets/:id/status (admin only)
ticketsRouter.patch('/:id/status', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const { status } = req.body as { status: string }
  const valid = ['new', 'sent', 'in_progress', 'resolved', 'rejected']
  if (!valid.includes(status)) {
    res.status(400).json({ ok: false, error: 'Invalid status' })
    return
  }

  const update: Record<string, unknown> = { status }
  if (status === 'resolved') update['resolvedAt'] = new Date()

  const ticket = await Ticket.findByIdAndUpdate(req.params['id'], { $set: update }, { new: true })
  if (!ticket) {
    res.status(404).json({ ok: false, error: 'Ticket not found' })
    return
  }

  sseService.ticketUpdated(req.params['id']!, { status })
  res.json({ ok: true, data: ticket })
})
