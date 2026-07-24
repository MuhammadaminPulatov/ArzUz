import type { Analytics, DailyStat, CategoryStat } from '../types'

export const DAILY_STATS: DailyStat[] = [
  { date: '18-iyul', reports: 3, resolved: 1 },
  { date: '19-iyul', reports: 5, resolved: 2 },
  { date: '20-iyul', reports: 4, resolved: 3 },
  { date: '21-iyul', reports: 8, resolved: 4 },
  { date: '22-iyul', reports: 6, resolved: 5 },
  { date: '23-iyul', reports: 9, resolved: 6 },
  { date: '24-iyul', reports: 7, resolved: 4 },
]

export const CATEGORY_STATS: CategoryStat[] = [
  { id: 'road',     label: "Yo'l",        color: '#EF4444', count: 12, resolved: 5 },
  { id: 'light',    label: 'Chiroq',      color: '#F59E0B', count: 8,  resolved: 6 },
  { id: 'water',    label: 'Suv',         color: '#3B82F6', count: 10, resolved: 4 },
  { id: 'electric', label: 'Elektr',      color: '#8B5CF6', count: 5,  resolved: 3 },
  { id: 'trash',    label: 'Axlat',       color: '#10B981', count: 9,  resolved: 7 },
  { id: 'tree',     label: "Ko'kat",      color: '#22C55E', count: 4,  resolved: 2 },
  { id: 'building', label: 'Bino',        color: '#6B7280', count: 6,  resolved: 2 },
  { id: 'other',    label: 'Boshqa',      color: '#64748B', count: 3,  resolved: 1 },
]

export const MOCK_ANALYTICS: Analytics = {
  totalReports: 57,
  resolvedCount: 30,
  inProgressCount: 18,
  pendingCount: 9,
  resolvedPercent: 53,
  avgResolutionDays: 2.4,
  activeUsers: 142,
  totalVotes: 1247,
  dailyStats: DAILY_STATS,
  categoryStats: CATEGORY_STATS,
}
