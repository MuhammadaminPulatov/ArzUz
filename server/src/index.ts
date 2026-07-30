import 'express-async-errors'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { env } from './config/env'
import { authRouter } from './routes/auth'
import { uploadRouter } from './routes/upload'
import { ticketsRouter } from './routes/tickets'
import { sseRouter } from './routes/sse'
import { adminRouter } from './routes/admin'
import { orgRouter } from './routes/org'
import { superAdminRouter } from './routes/superadmin'

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
app.use('/api/org',        orgRouter)
app.use('/api/superadmin', superAdminRouter)

app.use((_req, res) => res.status(404).json({ ok: false, error: 'Not found' }))

// Global error handler — catches async errors forwarded by express-async-errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  const status = (err as { status?: number }).status ?? 500
  res.status(status).json({ ok: false, error: err.message || 'Internal server error' })
})

export const httpServer = createServer(app)

export function startServer() {
  httpServer.listen(env.port, () => {
    console.log(`MahallFix API listening on :${env.port}`)
  })
}

if (require.main === module) {
  import('./config/db').then(({ connectDB }) => connectDB().then(startServer))
}
