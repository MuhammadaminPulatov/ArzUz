import mongoose from 'mongoose'

export interface UserDoc extends mongoose.Document {
  telegramId: string
  username: string
  firstName: string
  photoUrl?: string
  xp: number
  level: number
  badges: string[]
  plan: 'free' | 'premium'
  planExpiresAt?: Date
  reportCount: number
  resolvedCount: number
  lastActiveAt: Date
  createdAt: Date
}

interface UserModel extends mongoose.Model<UserDoc> {
  upsertFromTelegram(data: {
    telegramId: string
    username: string
    firstName: string
    photoUrl?: string
  }): Promise<UserDoc>
}

const userSchema = new mongoose.Schema<UserDoc, UserModel>(
  {
    telegramId:    { type: String, required: true, unique: true, index: true },
    username:      { type: String, required: true },
    firstName:     { type: String, required: true },
    photoUrl:      { type: String },
    xp:            { type: Number, default: 0 },
    level:         { type: Number, default: 1 },
    badges:        { type: [String], default: [] },
    plan:          { type: String, enum: ['free', 'premium'], default: 'free' },
    planExpiresAt: { type: Date },
    reportCount:   { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },
    lastActiveAt:  { type: Date, default: Date.now },
  },
  { timestamps: true },
)

userSchema.static(
  'upsertFromTelegram',
  async function (data: { telegramId: string; username: string; firstName: string; photoUrl?: string }): Promise<UserDoc> {
    return (this as UserModel).findOneAndUpdate(
      { telegramId: data.telegramId },
      {
        $set: {
          username:     data.username,
          firstName:    data.firstName,
          photoUrl:     data.photoUrl,
          lastActiveAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ) as Promise<UserDoc>
  },
)

export const User = mongoose.model<UserDoc, UserModel>('User', userSchema)
