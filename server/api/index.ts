/// <reference path="../src/types/express.d.ts" />
import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../src/config/env'
import { app } from '../src/index'

// Reuse DB connection across warm invocations
let connecting: Promise<void> | null = null

function ensureDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve()
  if (!connecting) {
    connecting = mongoose.connect(env.mongoUri).then(() => {
      console.log('MongoDB connected (serverless)')
    })
  }
  return connecting
}

export default async function handler(req: any, res: any) {
  await ensureDB()
  app(req, res)
}
