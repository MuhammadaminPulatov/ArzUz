import request from 'supertest'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { app } from '../index'
import { connectTestDB, closeTestDB, clearCollections } from './helpers'

beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearCollections() })
afterAll(async () => { await closeTestDB() })

describe('GET /health', () => {
  it('returns ok: true', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

function buildInitData(telegramId: string, botToken: string): string {
  const user = JSON.stringify({ id: parseInt(telegramId), first_name: 'Test', username: 'testuser' })
  const params = new URLSearchParams({ user, auth_date: String(Math.floor(Date.now() / 1000)) })

  const sorted = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secretKey).update(sorted).digest('hex')

  params.set('hash', hash)
  return params.toString()
}

describe('POST /api/auth/telegram', () => {
  it('issues JWT for valid initData (test mode)', async () => {
    // In test mode (TELEGRAM_BOT_TOKEN=test), any initData with valid user JSON is accepted
    const initData = buildInitData('42', 'test')
    const res = await request(app).post('/api/auth/telegram').send({ initData })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.token).toBeDefined()

    const payload = jwt.verify(res.body.data.token, process.env['JWT_SECRET']!) as { telegramId: string }
    expect(payload.telegramId).toBe('42')
  })

  it('returns 401 for initData with no user field', async () => {
    const res = await request(app)
      .post('/api/auth/telegram')
      .send({ initData: 'hash=bad&auth_date=1' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when initData is missing', async () => {
    const res = await request(app).post('/api/auth/telegram').send({})
    expect(res.status).toBe(400)
  })

  it('sets isAdmin: true for IDs in ADMIN_TELEGRAM_IDS', async () => {
    const initData = buildInitData('999', 'test') // 999 is in ADMIN_TELEGRAM_IDS (set in setup.ts)
    const res = await request(app).post('/api/auth/telegram').send({ initData })
    expect(res.status).toBe(200)
    const payload = jwt.verify(res.body.data.token, process.env['JWT_SECRET']!) as { isAdmin: boolean }
    expect(payload.isAdmin).toBe(true)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns user data for authenticated user', async () => {
    // First create the user via auth
    const initData = buildInitData('42', 'test')
    await request(app).post('/api/auth/telegram').send({ initData })

    const token = jwt.sign({ telegramId: '42', plan: 'free', isAdmin: false }, process.env['JWT_SECRET']!, { expiresIn: '7d' })
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.telegramId).toBe('42')
    expect(Array.isArray(res.body.data.tickets)).toBe(true)
  })
})
