import mongoose from 'mongoose'

export interface TicketDoc extends mongoose.Document {
  ticketId: string
  userId: string
  username: string
  firstName: string
  photoUrl: string
  photoThumbnailUrl: string
  category: string
  categoryLabel: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  aiTitle: string
  aiDescription: string
  department: string
  aiConfidence: number
  lat: number
  lng: number
  address: string
  district: string
  userNote: string
  status: 'new' | 'sent' | 'in_progress' | 'resolved' | 'rejected'
  priority: 'normal' | 'verified'
  votes: number
  voterIds: string[]
  channelMessageId?: number
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}

const ticketSchema = new mongoose.Schema<TicketDoc>(
  {
    ticketId:          { type: String, required: true, unique: true, index: true },
    userId:            { type: String, required: true, index: true },
    username:          { type: String, required: true },
    firstName:         { type: String, required: true },
    photoUrl:          { type: String, required: true },
    photoThumbnailUrl: { type: String, required: true },
    category:          { type: String, required: true },
    categoryLabel:     { type: String, required: true },
    severity:          { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    aiTitle:           { type: String, default: '' },
    aiDescription:     { type: String, default: '' },
    department:        { type: String, default: '' },
    aiConfidence:      { type: Number, default: 0 },
    lat:               { type: Number, required: true },
    lng:               { type: Number, required: true },
    address:           { type: String, required: true },
    district:          { type: String, default: '' },
    userNote:          { type: String, default: '' },
    status:            { type: String, enum: ['new', 'sent', 'in_progress', 'resolved', 'rejected'], default: 'new' },
    priority:          { type: String, enum: ['normal', 'verified'], default: 'normal' },
    votes:             { type: Number, default: 0 },
    voterIds:          { type: [String], default: [] },
    channelMessageId:  { type: Number },
    resolvedAt:        { type: Date },
  },
  { timestamps: true },
)

export const Ticket = mongoose.model<TicketDoc>('Ticket', ticketSchema)
