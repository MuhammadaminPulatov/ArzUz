export interface Report {
  id: string
  userId: string
  username: string
  userAvatar: string
  category: string
  categoryIcon: string
  categoryColor: string
  title: string
  description: string
  address: string
  lat: number
  lng: number
  photoColor: string
  photoEmoji: string
  status: 'new' | 'sent' | 'in_progress' | 'resolved'
  votes: number
  hasVoted: boolean
  createdAt: string
  aiSummary: string
  severity: 'low' | 'medium' | 'high'
  supporterAvatars: string[]
}

export interface Badge {
  id: string
  icon: string
  name: string
  description: string
  earned: boolean
  xpReward: number
  progress?: number
  total?: number
}

export type Status = Report['status']
export type Severity = Report['severity']
