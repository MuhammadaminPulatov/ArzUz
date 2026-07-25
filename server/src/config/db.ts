import mongoose from 'mongoose'
import { env } from './env'

export async function connectDB() {
  await mongoose.connect(env.mongoUri)
  console.log('MongoDB connected')
}

export async function disconnectDB() {
  await mongoose.disconnect()
}
