import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../index'
import { connectTestDB, closeTestDB } from './helpers'

beforeAll(async () => { await connectTestDB() })
afterAll(async () => { await closeTestDB() })

function makeToken(telegramId = '42') {
  return jwt.sign({ telegramId, plan: 'free', isAdmin: false }, process.env['JWT_SECRET']!, { expiresIn: '7d' })
}

describe('POST /api/upload', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/upload').attach('photo', Buffer.from('img'), 'x.jpg')
    expect(res.status).toBe(401)
  })

  it('returns 400 if no file attached', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${makeToken()}`)
    expect(res.status).toBe(400)
  })

  it('returns url and thumbnailUrl for valid upload', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${makeToken()}`)
      .attach('photo', Buffer.from('fake-jpeg-data'), { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.url).toMatch(/^https?:\/\//)
    expect(res.body.data.thumbnailUrl).toMatch(/^https?:\/\//)
  })
})
