import mongoose from 'mongoose'

export async function connectTestDB(): Promise<void> {
  const uri = process.env['MONGODB_URI']!
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri)
  }
}

export async function clearCollections(): Promise<void> {
  const cols = Object.values(mongoose.connection.collections)
  await Promise.all(cols.map((c) => c.deleteMany({})))
}

export async function closeTestDB(): Promise<void> {
  await mongoose.disconnect()
}
