import type { Badge } from '../types'

export const BADGES: Badge[] = [
  { id: 'first', icon: '🌱', name: 'Birinchi qadam', description: 'Birinchi arizangizni yubordingiz', earned: true, xpReward: 50 },
  { id: 'voter', icon: '👍', name: 'Jamoat ovozi', description: "10 ta arizani qo'llab-quvvatlang", earned: true, xpReward: 30, progress: 10, total: 10 },
  { id: 'reporter5', icon: '📋', name: 'Faol fuqaro', description: '5 ta ariza yuboring', earned: true, xpReward: 100, progress: 5, total: 5 },
  { id: 'reporter10', icon: '🏆', name: 'Mahalla qahramoni', description: '10 ta ariza yuboring', earned: false, xpReward: 200, progress: 5, total: 10 },
  { id: 'resolved', icon: '✅', name: 'Hal etuvchi', description: 'Arizangiz hal etildi', earned: true, xpReward: 150 },
  { id: 'streak', icon: '🔥', name: 'Ketma-ket 7 kun', description: '7 kun ketma-ket faollik', earned: false, xpReward: 75, progress: 3, total: 7 },
  { id: 'popular', icon: '⭐', name: 'Ommalashgan ariza', description: 'Arizangizga 20+ ovoz berildi', earned: false, xpReward: 120, progress: 14,    total: 20 },
  { id: 'verified', icon: '💎', name: 'Ishonchli fuqaro', description: 'Barcha arizalar tasdiqlangan', earned: true, xpReward: 300 },
]
