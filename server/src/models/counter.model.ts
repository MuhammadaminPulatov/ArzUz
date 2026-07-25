import mongoose from 'mongoose'

interface CounterDoc extends mongoose.Document {
  name: string
  seq: number
}

interface CounterModel extends mongoose.Model<CounterDoc> {
  nextTicketId(): Promise<string>
}

const counterSchema = new mongoose.Schema<CounterDoc, CounterModel>({
  name: { type: String, required: true, unique: true },
  seq:  { type: Number, default: 0 },
})

counterSchema.static('nextTicketId', async function (): Promise<string> {
  const doc = await (this as CounterModel).findOneAndUpdate(
    { name: 'ticket' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  )
  const year = new Date().getFullYear()
  const seq = String(doc!.seq).padStart(5, '0')
  return `MFX-${year}-${seq}`
})

export const Counter = mongoose.model<CounterDoc, CounterModel>('Counter', counterSchema)
