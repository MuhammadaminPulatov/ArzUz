import { MongoMemoryServer } from 'mongodb-memory-server'

// Jest globalSetup — runs once before all suites, sets env vars
module.exports = async () => {
  const mongod = await MongoMemoryServer.create()
  process.env['MONGODB_URI'] = mongod.getUri()
  process.env['JWT_SECRET'] = 'test_secret_32_chars_minimum_here_ok'
  process.env['ADMIN_TELEGRAM_IDS'] = '999'
  process.env['VERCEL_BLOB_READ_WRITE_TOKEN'] = 'test'
  process.env['TELEGRAM_BOT_TOKEN'] = 'test'
  ;(global as Record<string, unknown>).__MONGOD__ = mongod
}
