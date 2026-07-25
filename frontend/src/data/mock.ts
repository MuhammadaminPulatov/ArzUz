export type { Report, Badge } from '../types'
import type { Report, Badge } from '../types'

interface Category { id: string; icon: string; label: string; color: string; bg: string }

export const CATEGORIES: Category[] = [
  { id: 'road',     icon: '🚧', label: "Yo'l nosozligi",        color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  { id: 'light',    icon: '💡', label: "Chiroq nosozligi",       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { id: 'water',    icon: '💧', label: "Suv muammosi",           color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { id: 'electric', icon: '⚡', label: "Elektr muammosi",        color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { id: 'trash',    icon: '🗑️', label: "Axlat muammosi",         color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { id: 'tree',     icon: '🌳', label: "Ko'kalamzorlashtirish",  color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  { id: 'building', icon: '🏚️', label: "Bino nosozligi",         color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  { id: 'other',    icon: '📋', label: "Boshqa muammo",          color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
]

export const SAMPLE_REPORTS: Report[] = [
  {
    id: 'ARZ-1008', userId: 'u2', username: 'Sardor T.', userAvatar: 'S',
    category: "Yo'l nosozligi", categoryIcon: '🚧', categoryColor: '#EF4444',
    title: "Chorsu ko'chasida katta chuqur",
    description: "Ko'chaning markazida 40 sm li chuqur bor, avtomobillar shikastlanmoqda.",
    address: "Toshkent sh., Chorsu, Amir Temur ko'ch.", lat: 41.2995, lng: 69.2401,
    photoColor: '#DBEAFE', photoEmoji: '🚧', status: 'in_progress', votes: 47, hasVoted: false,
    createdAt: '2 soat oldin', aiSummary: "Yo'l yuzasida havfli jarlik aniqlandi.", severity: 'high',
    supporterAvatars: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'ARZ-1007', userId: 'u3', username: 'Malika R.', userAvatar: 'M',
    category: "Chiroq nosozligi", categoryIcon: '💡', categoryColor: '#F59E0B',
    title: "3-mavzeda 6 ta chiroq ishlamaydi",
    description: "Kecha tundan beri 3-mavze bosh ko'chasidagi chiroqlar o'chib qolgan.",
    address: "Mirzo Ulug'bek, 3-mavze", lat: 41.3110, lng: 69.2789,
    photoColor: '#FEF3C7', photoEmoji: '💡', status: 'sent', votes: 23, hasVoted: false,
    createdAt: '5 soat oldin', aiSummary: "Ko'cha yoritish tizimida uzilish aniqlandi.", severity: 'medium',
    supporterAvatars: ['E', 'F', 'G'],
  },
]

export const BADGES: Badge[] = [
  { id: 'first',     icon: '🌱', name: 'Birinchi qadam',      description: 'Birinchi arizangizni yubordingiz',   earned: true,  xpReward: 50 },
  { id: 'voter',     icon: '👍', name: 'Jamoat ovozi',        description: "10 ta arizani qo'llab-quvvatlang", earned: true,  xpReward: 30,  progress: 10, total: 10 },
  { id: 'reporter5', icon: '📋', name: 'Faol fuqaro',         description: '5 ta ariza yuboring',               earned: true,  xpReward: 100, progress: 5,  total: 5 },
  { id: 'reporter10',icon: '🏆', name: 'Mahalla qahramoni',   description: '10 ta ariza yuboring',              earned: false, xpReward: 200, progress: 5,  total: 10 },
  { id: 'resolved',  icon: '✅', name: 'Hal etuvchi',         description: 'Arizangiz hal etildi',              earned: true,  xpReward: 150 },
  { id: 'streak',    icon: '🔥', name: 'Ketma-ket 7 kun',    description: '7 kun ketma-ket faollik',           earned: false, xpReward: 75,  progress: 3,  total: 7 },
  { id: 'popular',   icon: '⭐', name: 'Ommalashgan ariza',  description: 'Arizangizga 20+ ovoz berildi',      earned: false, xpReward: 120, progress: 14, total: 20 },
  { id: 'verified',  icon: '💎', name: 'Ishonchli fuqaro',   description: 'Barcha arizalar tasdiqlangan',      earned: true,  xpReward: 300 },
]
