import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { env } from './config/env'
import { authRouter } from './routes/auth'
import { uploadRouter } from './routes/upload'
import { ticketsRouter } from './routes/tickets'
import { sseRouter } from './routes/sse'
import { adminRouter } from './routes/admin'

export const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

app.use('/api/auth',    authRouter)
app.use('/api/upload',  uploadRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/sse',     sseRouter)
app.use('/api/admin',   adminRouter)

app.use((_req, res) => res.status(404).json({ ok: false, error: 'Not found' }))

export const httpServer = createServer(app)

export function startServer() {
  httpServer.listen(env.port, () => {
    console.log(`MahallFix API listening on :${env.port}`)
  })
}

if (require.main === module) {
  import('./config/db').then(({ connectDB }) => connectDB().then(startServer))
}
