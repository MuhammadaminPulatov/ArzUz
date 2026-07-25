import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../index'
import { connectTestDB, closeTestDB, clearCollections } from './helpers'
import { Ticket } from '../models/ticket.model'
import { Counter } from '../models/counter.model'
import { User } from '../models/user.model'

beforeAll(async () => { await connectTestDB() })
afterEach(async () => { await clearCollections() })
afterAll(async () => { await closeTestDB() })

function makeAdminToken() {
  return jwt.sign({ telegramId: '999', plan: 'free', isAdmin: true }, process.env['JWT_SECRET']!, { expiresIn: '7d' })
}
function makeUserToken() {
  return jwt.sign({ telegramId: '42', plan: 'free', isAdmin: false }, process.env['JWT_SECRET']!, { expiresIn: '7d' })
}

async function seedTicket() {
  await User.upsertFromTelegram({ telegramId: '42', username: 'alice', firstName: 'Alice' })
  const id = await Counter.nextTicketId()
  return Ticket.create({
    ticketId: id,
    userId: '42',
    username: 'alice',
    firstName: 'Alice',
    photoUrl: 'https://x.com/p.jpg',
    photoThumbnailUrl: 'https://x.com/p.jpg',
    category: 'pothole',
    categoryLabel: "Yo'l nosozligi",
    lat: 41,
    lng: 69,
    address: 'Test',
  })
}

describe('GET /api/admin/tickets', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/tickets')
      .set('Authorization', `Bearer ${makeUserToken()}`)
    expect(res.status).toBe(403)
  })

  it('returns ticket list for admin', async () => {
    await seedTicket()
    const res = await request(app)
      .get('/api/admin/tickets')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body.data.tickets.length).toBe(1)
  })
})

describe('GET /api/admin/analytics', () => {
  it('returns counts and byStatus map', async () => {
    await seedTicket()
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body.data.total).toBe(1)
    expect(res.body.data.byStatus).toBeDefined()
  })
})

describe('PATCH /api/admin/tickets/:id', () => {
  it('admin can update status and aiTitle', async () => {
    const t = await seedTicket()
    const res = await request(app)
      .patch(`/api/admin/tickets/${t._id.toString()}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ status: 'resolved', aiTitle: 'Updated title' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('resolved')
    expect(res.body.data.aiTitle).toBe('Updated title')
  })
})
