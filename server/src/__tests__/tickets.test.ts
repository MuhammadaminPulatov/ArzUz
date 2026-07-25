import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../index'
import { connectTestDB, closeTestDB, clearCollections } from './helpers'
import { Counter } from '../models/counter.model'
import { Ticket } from '../models/ticket.model'
import { User } from '../models/user.model'

beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearCollections() })
afterAll(async () => { await closeTestDB() })

function makeToken(telegramId = '42', isAdmin = false) {
  return jwt.sign(
    { telegramId, plan: 'free', isAdmin },
    process.env['JWT_SECRET']!,
    { expiresIn: '7d' },
  )
}

// ──────── Model tests ────────

describe('Counter.nextTicketId()', () => {
  it('returns MFX-YYYY-00001 for first call', async () => {
    const id = await Counter.nextTicketId()
    expect(id).toMatch(/^MFX-\d{4}-00001$/)
  })

  it('increments on each call', async () => {
    const a = await Counter.nextTicketId()
    const b = await Counter.nextTicketId()
    const numA = parseInt(a.split('-')[2]!, 10)
    const numB = parseInt(b.split('-')[2]!, 10)
    expect(numB).toBe(numA + 1)
  })
})

describe('Ticket model', () => {
  it('creates a ticket with required fields and defaults', async () => {
    const ticketId = await Counter.nextTicketId()
    const doc = await Ticket.create({
      ticketId,
      userId: 'tg_123',
      username: 'testuser',
      firstName: 'Test',
      photoUrl: 'https://example.com/photo.jpg',
      photoThumbnailUrl: 'https://example.com/thumb.jpg',
      category: 'pothole',
      categoryLabel: "Yo'l nosozligi",
      lat: 41.299,
      lng: 69.24,
      address: 'Test st, 1',
    })
    expect(doc.ticketId).toMatch(/^MFX-/)
    expect(doc.status).toBe('new')
    expect(doc.votes).toBe(0)
    expect(doc.priority).toBe('normal')
  })
})

describe('User model', () => {
  it('upsertFromTelegram creates user on first call', async () => {
    const user = await User.upsertFromTelegram({ telegramId: '123', username: 'alice', firstName: 'Alice' })
    expect(user.telegramId).toBe('123')
    expect(user.plan).toBe('free')
    expect(user.xp).toBe(0)
  })

  it('upsertFromTelegram updates without resetting counts', async () => {
    await User.upsertFromTelegram({ telegramId: '123', username: 'alice', firstName: 'Alice' })
    await User.updateOne({ telegramId: '123' }, { $inc: { reportCount: 3 } })
    const user = await User.upsertFromTelegram({ telegramId: '123', username: 'alice2', firstName: 'Alice' })
    expect(user.reportCount).toBe(3)
    expect(user.username).toBe('alice2')
  })
})

// ──────── Route tests ────────

const baseBody = {
  photoUrl: 'https://blob.vercel.com/photo.jpg',
  photoThumbnailUrl: 'https://blob.vercel.com/photo.jpg',
  category: 'pothole',
  categoryLabel: "Yo'l nosozligi",
  severity: 'high',
  lat: 41.299,
  lng: 69.24,
  address: "Test ko'cha, 1",
  district: 'Yunusobod',
  userNote: 'Katta chuqur',
}

describe('POST /api/tickets', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/api/tickets').send(baseBody)
    expect(res.status).toBe(401)
  })

  it('creates ticket with MFX-YYYY-NNNNN id', async () => {
    await User.upsertFromTelegram({ telegramId: '42', username: 'alice', firstName: 'Alice' })
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('42')}`)
      .send(baseBody)
    expect(res.status).toBe(201)
    expect(res.body.data.ticketId).toMatch(/^MFX-\d{4}-\d{5}$/)
    expect(res.body.data.status).toBe('new')
    expect(res.body.data.userId).toBe('42')
  })
})

describe('GET /api/tickets', () => {
  it('returns paginated list without auth', async () => {
    await User.upsertFromTelegram({ telegramId: '42', username: 'alice', firstName: 'Alice' })
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('42')}`)
      .send(baseBody)
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.tickets)).toBe(true)
    expect(res.body.data.tickets.length).toBeGreaterThan(0)
    expect(typeof res.body.data.total).toBe('number')
  })
})

describe('POST /api/tickets/:id/vote', () => {
  it('increments vote count', async () => {
    await User.upsertFromTelegram({ telegramId: '99', username: 'bob', firstName: 'Bob' })
    await User.upsertFromTelegram({ telegramId: '42', username: 'alice', firstName: 'Alice' })
    const create = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('99')}`)
      .send(baseBody)
    const id = create.body.data._id as string

    const res = await request(app)
      .post(`/api/tickets/${id}/vote`)
      .set('Authorization', `Bearer ${makeToken('42')}`)
    expect(res.status).toBe(200)
    expect(res.body.data.votes).toBe(1)
  })

  it('prevents double vote', async () => {
    await User.upsertFromTelegram({ telegramId: '99', username: 'bob', firstName: 'Bob' })
    const create = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('99')}`)
      .send(baseBody)
    const id = create.body.data._id as string

    await request(app)
      .post(`/api/tickets/${id}/vote`)
      .set('Authorization', `Bearer ${makeToken('42')}`)

    const res = await request(app)
      .post(`/api/tickets/${id}/vote`)
      .set('Authorization', `Bearer ${makeToken('42')}`)
    expect(res.status).toBe(409)
  })
})

describe('PATCH /api/tickets/:id/status', () => {
  it('requires admin', async () => {
    await User.upsertFromTelegram({ telegramId: '42', username: 'alice', firstName: 'Alice' })
    const create = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('42')}`)
      .send(baseBody)
    const id = create.body.data._id as string

    const res = await request(app)
      .patch(`/api/tickets/${id}/status`)
      .set('Authorization', `Bearer ${makeToken('42', false)}`)
      .send({ status: 'in_progress' })
    expect(res.status).toBe(403)
  })

  it('admin can update status', async () => {
    await User.upsertFromTelegram({ telegramId: '42', username: 'alice', firstName: 'Alice' })
    const create = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${makeToken('42')}`)
      .send(baseBody)
    const id = create.body.data._id as string

    const res = await request(app)
      .patch(`/api/tickets/${id}/status`)
      .set('Authorization', `Bearer ${makeToken('999', true)}`)
      .send({ status: 'in_progress' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('in_progress')
  })
})
