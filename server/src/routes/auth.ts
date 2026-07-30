import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { User } from '../models/user.model'
import { Ticket } from '../models/ticket.model'
import { authMiddleware } from '../middleware/auth'

export const authRouter = Router()

function verifyInitData(
  initData: string,
): { telegramId: string; username: string; firstName: string } | null {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  params.delete('hash')

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(env.telegramBotToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (expectedHash !== hash) return null

  const userRaw = params.get('user')
  if (!userRaw) return null

  const parsed = JSON.parse(userRaw) as { id: number; first_name: string; username?: string }
  return {
    telegramId: String(parsed.id),
    firstName:  parsed.first_name,
    username:   parsed.username ?? `user${parsed.id}`,
  }
}

// POST /api/auth/telegram
authRouter.post('/telegram', async (req: Request, res: Response) => {
  const { initData } = req.body as { initData?: string }

  if (!initData) {
    res.status(400).json({ ok: false, error: 'initData required' })
    return
  }

  const isTest = !env.telegramBotToken || env.telegramBotToken === 'test'
  let userData: { telegramId: string; username: string; firstName: string } | null = null

  if (isTest) {
    const p = new URLSearchParams(initData)
    const userRaw = p.get('user')
    if (userRaw) {
      const parsed = JSON.parse(userRaw) as { id: number; first_name: string; username?: string }
      userData = {
        telegramId: String(parsed.id),
        firstName:  parsed.first_name,
        username:   parsed.username ?? `user${parsed.id}`,
      }
    }
  } else {
    userData = verifyInitData(initData)
  }

  if (!userData) {
    res.status(401).json({ ok: false, error: 'Invalid initData' })
    return
  }

  const user = await User.upsertFromTelegram(userData)
  const isAdmin      = env.adminIds.includes(userData.telegramId)
  const isSuperAdmin = env.superAdminIds.includes(userData.telegramId)

  const token = jwt.sign(
    { telegramId: userData.telegramId, plan: user.plan, isAdmin, isSuperAdmin },
    env.jwtSecret,
    { expiresIn: '7d' },
  )

  res.json({
    ok: true,
    data: {
      token,
      user: {
        telegramId: user.telegramId,
        username:   user.username,
        firstName:  user.firstName,
        xp:         user.xp,
        plan:       user.plan,
        isAdmin,
        isSuperAdmin,
      },
    },
  })
})

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const telegramId = (req as any).user!.telegramId as string
  let user = await User.findOne({ telegramId }).lean()
  if (!user) {
    res.status(404).json({ ok: false, error: 'User not found' })
    return
  }

  // Daily streak — award +50 XP on first visit each day
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null
  if (lastDate) lastDate.setHours(0, 0, 0, 0)

  const isFirstToday = !lastDate || lastDate.getTime() < today.getTime()
  if (isFirstToday) {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const isConsecutive = !!lastDate && lastDate.getTime() === yesterday.getTime()
    const newStreak = isConsecutive ? (user.streak ?? 0) + 1 : 1

    await User.findOneAndUpdate(
      { telegramId },
      {
        $inc: { xp: 50 },
        $set: { streak: newStreak, lastStreakDate: new Date(), lastActiveAt: new Date() },
      },
    )
    user = await User.findOne({ telegramId }).lean()
  }

  const tickets = await Ticket.find({ userId: telegramId }).sort({ createdAt: -1 }).limit(20)

  res.json({ ok: true, data: { ...user, isAdmin: (req as any).user!.isAdmin, tickets } })
})

// GET /api/leaderboard — public, no auth required
authRouter.get('/leaderboard', async (req: Request, res: Response) => {
  const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '10'), 10))
  const users = await User.find()
    .sort({ xp: -1 })
    .limit(limit)
    .select('telegramId firstName username xp reportCount badges')
    .lean()

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    telegramId: u.telegramId,
    firstName: u.firstName,
    username: u.username,
    xp: u.xp,
    reportCount: u.reportCount,
    badges: u.badges,
  }))

  res.json({ ok: true, data: leaderboard })
})
