import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import { addClient, removeClient } from '../services/sseService'

export const sseRouter = Router()

// GET /api/sse  — Server-Sent Events endpoint
// Clients connect here to receive real-time ticket events.
// EventSource auto-reconnects, so Vercel's 60s function timeout is handled gracefully.
sseRouter.get('/', (req: Request, res: Response) => {
  const clientId = randomUUID()
  addClient(clientId, res)

  req.on('close', () => {
    removeClient(clientId)
  })
})
