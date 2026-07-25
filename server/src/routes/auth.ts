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
  const isAdmin = env.adminIds.includes(userData.telegramId)

  const token = jwt.sign(
    { telegramId: userData.telegramId, plan: user.plan, isAdmin },
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
      },
    },
  })
})

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = await User.findOne({ telegramId: req.user!.telegramId }).lean()
  if (!user) {
    res.status(404).json({ ok: false, error: 'User not found' })
    return
  }
  const tickets = await Ticket.find({ userId: req.user!.telegramId })
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({ ok: true, data: { ...user, tickets } })
})
