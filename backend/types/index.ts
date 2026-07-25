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
  status: 'sent' | 'in_progress' | 'resolved'
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

export interface Category {
  id: string
  icon: string
  label: string
  color: string
  bg: string
}

export interface DailyStat {
  date: string
  reports: number
  resolved: number
}

export interface CategoryStat {
  id: string
  label: string
  color: string
  count: number
  resolved: number
}

export interface Analytics {
  totalReports: number
  resolvedCount: number
  inProgressCount: number
  pendingCount: number
  resolvedPercent: number
  avgResolutionDays: number
  activeUsers: number
  totalVotes: number
  dailyStats: DailyStat[]
  categoryStats: CategoryStat[]
}

export interface AdminReport extends Report {
  district: string
}

export interface ApiResponse<T> {
  data: T
  ok: boolean
  error?: string
}

export interface Notification {
  id: string
  reportId: string
  reportTitle: string
  message: string
  type: 'resolved' | 'in_progress' | 'comment'
  read: boolean
  createdAt: string
}

export interface District {
  id: string
  name: string
  lat: number
  lng: number
  total: number
  byCategory: Record<string, number>
  dominant: string
  dominantColor: string
}
