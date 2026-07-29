import { config } from 'dotenv'
config()
config({ path: '.env.local', override: true })

function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

export const env = {
  mongoUri:          required('MONGODB_URI'),
  jwtSecret:         required('JWT_SECRET'),
  telegramBotToken:  process.env['TELEGRAM_BOT_TOKEN'] ?? '',
  telegramChannelId: process.env['TELEGRAM_CHANNEL_ID'] ?? '',
  blobToken:         process.env['BLOB_READ_WRITE_TOKEN'] ?? process.env['VERCEL_BLOB_READ_WRITE_TOKEN'] ?? '',
  geminiKey:         process.env['GEMINI_API_KEY'] ?? '',
  adminIds:          (process.env['ADMIN_TELEGRAM_IDS'] ?? '').split(',').filter(Boolean),
  port:              parseInt(process.env['PORT'] ?? '3001', 10),
}
