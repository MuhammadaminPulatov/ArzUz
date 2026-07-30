import mongoose from 'mongoose'

export interface OrgDoc extends mongoose.Document {
  orgId: string
  name: string
  shortName: string
  icon: string
  category: string
  district: string
  phone: string
  username: string
  passwordHash: string
  createdAt: Date
}

const orgSchema = new mongoose.Schema<OrgDoc>(
  {
    orgId:        { type: String, required: true, unique: true, index: true },
    name:         { type: String, required: true },
    shortName:    { type: String, required: true },
    icon:         { type: String, default: '🏛' },
    category:     { type: String, required: true },
    district:     { type: String, required: true },
    phone:        { type: String, default: '' },
    username:     { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
)

export const Organization = mongoose.model<OrgDoc>('Organization', orgSchema)
