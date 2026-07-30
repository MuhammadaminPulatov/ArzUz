import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { authMiddleware } from '../middleware/auth'
import { superAdminOnly } from '../middleware/superAdminOnly'
import { Ticket } from '../models/ticket.model'
import { Organization } from '../models/organization.model'
import { User } from '../models/user.model'
import { env } from '../config/env'

export const superAdminRouter = Router()
superAdminRouter.use(authMiddleware, superAdminOnly)

// GET /api/superadmin/stats
superAdminRouter.get('/stats', async (_req: Request, res: Response) => {
  const [
    totalTickets,
    byStatusRaw,
    byCategoryRaw,
    totalUsers,
    totalOrgs,
    avgArr,
  ] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Organization.countDocuments(),
    Ticket.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
      { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
      { $group: { _id: null, avg: { $avg: '$diff' } } },
    ]),
  ])

  const byStatus: Record<string, number> = {}
  for (const r of byStatusRaw) byStatus[r._id as string] = r.count as number

  const byCategory: Record<string, number> = {}
  for (const r of byCategoryRaw) byCategory[r._id as string] = r.count as number

  const avgMs = (avgArr[0]?.avg as number | undefined) ?? 0

  res.json({
    ok: true,
    data: {
      totalTickets,
      totalUsers,
      totalOrgs,
      byStatus,
      byCategory,
      avgResolutionDays: Math.round(avgMs / 86400000),
      resolved:   byStatus['resolved'] ?? 0,
      inProgress: byStatus['in_progress'] ?? 0,
      pending:    (byStatus['new'] ?? 0) + (byStatus['sent'] ?? 0),
    },
  })
})

// GET /api/superadmin/organizations
superAdminRouter.get('/organizations', async (_req: Request, res: Response) => {
  const orgs = await Organization.find().lean()

  const orgStats = await Promise.all(
    orgs.map(async (org) => {
      const [total, byStatusRaw] = await Promise.all([
        Ticket.countDocuments({ assignedOrgId: org.orgId }),
        Ticket.aggregate([
          { $match: { assignedOrgId: org.orgId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ])
      const byStatus: Record<string, number> = {}
      for (const r of byStatusRaw) byStatus[r._id as string] = r.count as number
      return {
        orgId:         org.orgId,
        name:          org.name,
        shortName:     org.shortName,
        icon:          org.icon,
        category:      org.category,
        district:      org.district,
        phone:         org.phone,
        username:      org.username,
        totalAssigned: total,
        resolved:      byStatus['resolved'] ?? 0,
        inProgress:    byStatus['in_progress'] ?? 0,
      }
    })
  )

  res.json({ ok: true, data: orgStats })
})

// POST /api/superadmin/organizations
superAdminRouter.post('/organizations', async (req: Request, res: Response) => {
  const { name, shortName, icon, category, district, phone, username, password } = req.body as Record<string, string>

  if (!name || !shortName || !username || !password || !category || !district) {
    res.status(400).json({ ok: false, error: 'name, shortName, category, district, username, password kerak' })
    return
  }

  const existing = await Organization.findOne({ username })
  if (existing) {
    res.status(409).json({ ok: false, error: 'Bu username allaqachon mavjud' })
    return
  }

  const count = await Organization.countDocuments()
  const orgId = `org-${count + 1}`
  const passwordHash = await bcrypt.hash(password, 10)

  const org = await Organization.create({
    orgId, name, shortName, icon: icon || '🏛', category, district,
    phone: phone || '', username, passwordHash,
  })

  res.json({ ok: true, data: { orgId: org.orgId, name: org.name, username: org.username } })
})

// DELETE /api/superadmin/organizations/:orgId
superAdminRouter.delete('/organizations/:orgId', async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string }
  const org = await Organization.findOneAndDelete({ orgId })
  if (!org) {
    res.status(404).json({ ok: false, error: 'Tashkilot topilmadi' })
    return
  }
  res.json({ ok: true, data: { orgId } })
})

// GET /api/superadmin/admins
superAdminRouter.get('/admins', async (_req: Request, res: Response) => {
  const adminIds      = env.adminIds
  const superAdminIds = env.superAdminIds

  const allIds = [...new Set([...adminIds, ...superAdminIds])]
  const adminUsers = await User.find({ telegramId: { $in: allIds } })
    .select('telegramId firstName username xp reportCount lastActiveAt')
    .lean()

  const admins = allIds.map((id) => {
    const user = adminUsers.find((u) => u.telegramId === id)
    return {
      telegramId:   id,
      firstName:    user?.firstName ?? '—',
      username:     user?.username ?? '—',
      xp:           user?.xp ?? 0,
      reportCount:  user?.reportCount ?? 0,
      lastActiveAt: user?.lastActiveAt ?? null,
      isSuperAdmin: superAdminIds.includes(id),
    }
  })

  res.json({ ok: true, data: admins })
})
