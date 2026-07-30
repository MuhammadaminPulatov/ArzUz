import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, ChevronRight, Zap, Star, Trophy, MapPin, Shield,
  FileText, Award, Crown, Sparkles, Gift, Users, Lock,
  TrendingUp, Flame, Heart, BadgeCheck,
} from 'lucide-react'
import { BADGES } from '../data/mock'
import { api } from '../lib/api'
import { getTelegramUserName, getTelegramUsername } from '../hooks/useAuth'
import { normalizeTicket } from '../hooks/useReports'
import type { Report } from '../types'

/* ──────────────────────────────────────────────────────────────
   Title system
────────────────────────────────────────────────────────────── */
const TITLES = [
  { id: 'yangi',         label: 'Yangi a\'zo',         minXp: 0,    color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  { id: 'faol',          label: 'Faol fuqaro',          minXp: 500,  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { id: 'mahalla_faoli', label: 'MahallaFaoli',         minXp: 1000, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { id: 'eco_faol',      label: 'EcoFaol',              minXp: 1500, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'jamoat',        label: 'JamoatchilikFaoli',   minXp: 2000, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 'qahramon',      label: 'Mahalla Qahramoni',   minXp: 3000, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
] as const

function getTitle(xp: number): typeof TITLES[number] {
  let t: typeof TITLES[number] = TITLES[0]
  for (const title of TITLES) { if (xp >= title.minXp) t = title }
  return t
}

/* ──────────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; text: string; dot: string; bg: string }> = {
  new:         { label: 'Yangi',      text: '#B45309', dot: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  sent:        { label: 'Yuborildi',  text: '#B45309', dot: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  in_progress: { label: 'Jarayonda', text: '#1D4ED8', dot: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  resolved:    { label: 'Hal Etildi',text: '#065F46', dot: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

// Reward catalog
const REWARDS = [
  { id: 'r1', icon: Gift,   label: 'UzCard bonusi',      xp: 500,  desc: '50,000 so\'m',   color: '#10B981' },
  { id: 'r2', icon: Crown,  label: 'Premium oy',         xp: 1000, desc: '1 oylik',         color: '#F59E0B' },
  { id: 'r3', icon: Zap,    label: 'Internet pakeт',     xp: 300,  desc: '2 GB bonus',      color: '#3B82F6' },
  { id: 'r4', icon: Trophy, label: 'Musobaqaga kirish', xp: 800,  desc: 'Regional',        color: '#8B5CF6' },
]

const TABS = [
  { id: 'reports',     label: 'Arizalarim', icon: FileText },
  { id: 'badges',      label: 'Nishonlar',  icon: Award },
  { id: 'rewards',     label: 'Mukofotlar', icon: Gift },
  { id: 'leaderboard', label: 'Reyting',    icon: Trophy },
] as const

type Tab = typeof TABS[number]['id']

interface LeaderboardEntry {
  rank: number
  telegramId: string
  firstName: string
  username: string
  xp: number
  reportCount: number
  badges: string[]
}

interface ProfileProps { onOpenAdmin: () => void }

export default function Profile({ onOpenAdmin }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('reports')
  const [myReports, setMyReports] = useState<Report[]>([])
  const [firstName, setFirstName] = useState(getTelegramUserName())
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reportCount, setReportCount] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [totalVotes, setTotalVotes] = useState(0)
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([])
  const [myTelegramId, setMyTelegramId] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [streak,  setStreak]  = useState(0)
  const [spentXp, setSpentXp] = useState(0)

  useEffect(() => {
    api.get<{
      telegramId: string; firstName: string; xp: number; level: number;
      isAdmin: boolean; reportCount: number; resolvedCount: number;
      badges: string[]; tickets: Report[]; streak?: number; spentXp?: number
    }>('/auth/me')
      .then((u) => {
        setMyTelegramId(u.telegramId)
        setFirstName(u.firstName)
        setXp(u.xp)
        setLevel(u.level)
        setIsAdmin(u.isAdmin ?? false)
        setReportCount(u.reportCount)
        setResolvedCount(u.resolvedCount)
        setEarnedBadgeIds(u.badges ?? [])
        setMyReports((u.tickets ?? []).map(normalizeTicket as any))
        setTotalVotes((u.tickets ?? []).reduce((sum, t) => sum + ((t as any).votes ?? 0), 0))
        setStreak(u.streak ?? 0)
        setSpentXp(u.spentXp ?? 0)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get<LeaderboardEntry[]>('/auth/leaderboard').then(setLeaderboard).catch(() => {})
  }, [])

  const nextLevelXp = Math.ceil((xp + 1) / 500) * 500
  const progress = (xp / nextLevelXp) * 100
  const earnedBadges = earnedBadgeIds.length
  const currentTitle = getTitle(xp)
  const nextTitle = TITLES.find(t => t.minXp > xp)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F0F4FF' }}>

      {/* ── Header ── */}
      <div
        className="px-4 pt-5 pb-5 shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', transform: 'translate(20%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', transform: 'translate(-30%, 40%)' }} />

        {/* Avatar row */}
        <div className="flex items-start gap-4 mb-4 relative">
          <div className="relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-[68px] h-[68px] rounded-[22px] flex items-center justify-center text-[28px] font-black text-white"
              style={{
                background: 'rgba(255,255,255,0.18)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {firstName.charAt(0).toUpperCase()}
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ background: '#10B981' }}>
              <CheckCircle2 size={11} className="text-white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[19px] font-black text-white tracking-tight">{firstName}</h2>
              {isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                >
                  <Shield size={10} style={{ color: '#93C5FD' }} strokeWidth={2.5} />
                  <span className="text-[9px] font-bold" style={{ color: '#93C5FD' }}>Admin</span>
                </motion.button>
              )}
            </div>

            {/* Title badge — prominent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 mt-1.5"
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                style={{ background: currentTitle.bg, border: `1px solid ${currentTitle.color}30` }}>
                <Crown size={11} strokeWidth={2.5} style={{ color: currentTitle.color }} />
                <span className="text-[11.5px] font-bold" style={{ color: currentTitle.color }}>
                  {currentTitle.label}
                </span>
              </div>
            </motion.div>

            <p className="text-[11px] text-blue-200 mt-1">
              {getTelegramUsername() ? `@${getTelegramUsername()}` : '—'}
            </p>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <Zap size={11} style={{ color: '#FCD34D' }} strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-white">{xp} XP</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <Award size={11} style={{ color: '#FCD34D' }} strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-white">{earnedBadges} nishon</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-blue-200 mb-0.5">Daraja</p>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
            >
              <span className="text-[22px] font-black text-white">{level}</span>
            </motion.div>
            <p className="text-[9px] text-blue-200 mt-0.5">{currentTitle.label.split(' ')[0]}</p>
          </div>
        </div>

        {/* XP progress */}
        <div className="relative">
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-blue-200">{currentTitle.label}</span>
            <span className="text-[11px] font-semibold text-blue-200">{xp} / {nextLevelXp} XP</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
              className="h-full rounded-full relative overflow-hidden"
              style={{ background: 'linear-gradient(90deg, #FCD34D, #F59E0B)' }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 1.5 }}
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
              />
            </motion.div>
          </div>
          {nextTitle && (
            <p className="text-[10.5px] text-blue-200 mt-1.5 flex items-center gap-1">
              <TrendingUp size={10} strokeWidth={2.5} />
              {nextLevelXp - xp} XP qoldi → "{nextTitle.label}" unvoni
            </p>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="flex gap-2 px-4 py-3 shrink-0">
        {[
          { Icon: FileText,     value: reportCount,  label: 'Ariza',      gradient: 'linear-gradient(135deg,#3B82F6,#6366F1)', shadow: 'rgba(99,102,241,0.2)' },
          { Icon: CheckCircle2, value: resolvedCount, label: 'Hal etildi', gradient: 'linear-gradient(135deg,#10B981,#059669)', shadow: 'rgba(16,185,129,0.2)' },
          { Icon: Heart,        value: totalVotes,    label: 'Ovoz',       gradient: 'linear-gradient(135deg,#8B5CF6,#6366F1)', shadow: 'rgba(139,92,246,0.2)' },
          { Icon: Flame,        value: streak,        label: 'Streak',     gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)', shadow: 'rgba(245,158,11,0.2)' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className="flex-1 rounded-2xl p-2.5 text-center relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: `0 4px 14px ${s.shadow}` }}
          >
            <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl" style={{ background: s.gradient }} />
            <s.Icon size={14} strokeWidth={2} className="mx-auto mb-1" style={{ color: s.gradient.includes('B82F6') ? '#3B82F6' : s.gradient.includes('10B981') ? '#10B981' : s.gradient.includes('8B5CF6') ? '#8B5CF6' : '#F59E0B' }} />
            <div className="text-[16px] font-black" style={{ color: '#0F172A' }}>{s.value}</div>
            <div className="text-[9px] font-semibold mt-0.5" style={{ color: '#94A3B8' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Tab bar (scrollable 4 tabs) ── */}
      <div className="flex px-4 gap-1.5 shrink-0 mb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-2xl text-[11.5px] font-bold shrink-0"
              style={{
                background: isActive ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : 'rgba(255,255,255,0.8)',
                color: isActive ? '#fff' : '#94A3B8',
                boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.3)' : '0 1px 4px rgba(15,23,42,0.05)',
                border: isActive ? 'none' : '1px solid rgba(226,232,240,0.8)',
              }}
            >
              <Icon size={13} strokeWidth={2.2} />
              {tab.label}
            </motion.button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-1">
        <AnimatePresence mode="wait">

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="flex flex-col gap-3">
              {myReports.map((r, i) => {
                const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG['new']
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.28 }}
                    className="flex items-center gap-3 p-3.5 rounded-3xl"
                    style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', boxShadow: '0 3px 16px rgba(15,23,42,0.07)', border: '1px solid rgba(255,255,255,0.8)' }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: r.photoColor }}>{r.photoEmoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold" style={{ color: '#3B82F6' }}>{r.id}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0F172A' }}>{r.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={10} style={{ color: '#94A3B8' }} strokeWidth={2} />
                        <span className="text-[10px] truncate" style={{ color: '#94A3B8' }}>{r.address}</span>
                        <Heart size={10} style={{ color: '#94A3B8' }} strokeWidth={2} />
                        <span className="text-[10px]" style={{ color: '#94A3B8' }}>{r.votes}</span>
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: '#CBD5E1' }} strokeWidth={2} />
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* BADGES */}
          {activeTab === 'badges' && (
            <motion.div key="badges" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>

              {/* Title progression teaser */}
              <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 12px rgba(139,92,246,0.07)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={14} style={{ color: '#8B5CF6' }} strokeWidth={2.5} />
                  <p className="text-[12.5px] font-bold" style={{ color: '#0F172A' }}>Unvonlar</p>
                </div>
                <div className="flex flex-col gap-2">
                  {TITLES.map((t) => {
                    const unlocked = xp >= t.minXp
                    const isCurrent = t === currentTitle
                    return (
                      <div key={t.id} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: unlocked ? t.color : '#E2E8F0' }} />
                        <span className="flex-1 text-[11.5px] font-semibold" style={{ color: unlocked ? '#0F172A' : '#CBD5E1' }}>
                          {t.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${t.color}20`, color: t.color }}>
                            Hozirgi
                          </span>
                        )}
                        {!unlocked && (
                          <span className="text-[9px]" style={{ color: '#CBD5E1' }}>{t.minXp} XP</span>
                        )}
                        {unlocked && !isCurrent && (
                          <CheckCircle2 size={12} style={{ color: t.color }} strokeWidth={2.5} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Badges grid */}
              <div className="grid grid-cols-2 gap-3">
                {BADGES.map((badge, i) => {
                const earned = earnedBadgeIds.includes(badge.id)
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
                    className="rounded-3xl p-4 relative overflow-hidden"
                    style={{
                      background: earned ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                      boxShadow: earned ? '0 4px 20px rgba(59,130,246,0.12)' : '0 1px 4px rgba(15,23,42,0.04)',
                      border: earned ? '1.5px solid rgba(99,102,241,0.2)' : '1.5px solid rgba(148,163,184,0.12)',
                      opacity: earned ? 1 : 0.62,
                    }}
                  >
                    {earned ? (
                      <div className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5">
                        <Lock size={11} style={{ color: '#CBD5E1' }} strokeWidth={2.5} />
                      </div>
                    )}

                    <motion.div
                      className="text-4xl mb-2.5"
                      animate={earned ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                    >
                      {badge.icon}
                    </motion.div>
                    <p className="text-[12.5px] font-bold leading-tight" style={{ color: '#0F172A' }}>{badge.name}</p>
                    <p className="text-[10px] mt-1 leading-snug" style={{ color: '#94A3B8' }}>{badge.description}</p>

                    {badge.progress !== undefined && badge.total ? (
                      <div className="mt-3">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[9px] font-medium" style={{ color: '#94A3B8' }}>{badge.progress}/{badge.total}</span>
                          <span className="text-[9px] font-bold" style={{ color: '#6366F1' }}>+{badge.xpReward} XP</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.2)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(badge.progress / badge.total) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-2">
                        <Zap size={10} style={{ color: '#6366F1' }} strokeWidth={2.5} />
                        <span className="text-[9px] font-bold" style={{ color: '#6366F1' }}>+{badge.xpReward} XP</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}

                {/* Taniqli premium badge (admin-assigned) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: BADGES.length * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
                  className="rounded-3xl p-4 relative overflow-hidden col-span-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.04))',
                    border: '1.5px solid rgba(245,158,11,0.3)',
                    boxShadow: '0 4px 20px rgba(245,158,11,0.1)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
                      <BadgeCheck size={22} className="text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-black" style={{ color: '#0F172A' }}>Taniqli</p>
                        <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#92400E' }}>
                          <Crown size={9} strokeWidth={2.5} /> Admin tayinlagan
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: '#94A3B8' }}>
                        Blogger yoki taniqli shaxslar uchun maxsus badge. Admin tomonidan beriladi.
                      </p>
                    </div>
                    <Lock size={14} style={{ color: '#CBD5E1' }} strokeWidth={2.5} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* REWARDS / MONETIZATION */}
          {activeTab === 'rewards' && (
            <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>

              {/* XP balance */}
              <div className="rounded-2xl p-4 mb-4 flex items-center gap-4"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', boxShadow: '0 8px 28px rgba(37,99,235,0.3)' }}>
                <div>
                  <p className="text-[11px] text-blue-200 mb-0.5">Mavjud XP</p>
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-yellow-300" strokeWidth={2.5} />
                    <span className="text-[28px] font-black text-white leading-none">{xp}</span>
                  </div>
                </div>
                <div className="h-12 w-px ml-2" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <div className="flex-1">
                  <p className="text-[11px] text-blue-200 mb-1">Sarflangan</p>
                  <p className="text-[16px] font-black text-white">{spentXp} XP</p>
                  <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${xp + spentXp > 0 ? Math.round((spentXp / (xp + spentXp)) * 100) : 0}%`, background: '#FCD34D' }} />
                  </div>
                </div>
              </div>

              {/* How to earn */}
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: '#fff', border: '1px solid rgba(16,185,129,0.15)', boxShadow: '0 2px 12px rgba(16,185,129,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} style={{ color: '#10B981' }} strokeWidth={2.5} />
                  <p className="text-[12.5px] font-bold" style={{ color: '#0F172A' }}>XP qanday qo'shiladi?</p>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Yangi ariza yuborish',       xp: '+150 XP' },
                    { label: 'Muammo hal etildi',           xp: '+300 XP' },
                    { label: 'Arizaga ovoz to\'plash',     xp: '+5 XP/ovoz' },
                    { label: 'Kun sayin aktiv bo\'lish',    xp: '+50 XP/kun' },
                    { label: 'Nishon olish',                xp: '+100-500 XP' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                        <span className="text-[12px]" style={{ color: '#334155' }}>{r.label}</span>
                      </div>
                      <span className="text-[11.5px] font-bold" style={{ color: '#10B981' }}>{r.xp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward catalog */}
              <p className="text-[11.5px] font-bold mb-2" style={{ color: '#64748B' }}>Mukofotlar katalogi</p>
              <div className="flex flex-col gap-2.5">
                {REWARDS.map((rw, i) => {
                  const Icon = rw.icon
                  const canAfford = xp >= rw.xp
                  return (
                    <motion.div key={rw.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl"
                      style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.9)', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${rw.color}18` }}>
                        <Icon size={20} style={{ color: rw.color }} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>{rw.label}</p>
                        <p className="text-[11px]" style={{ color: '#94A3B8' }}>{rw.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Zap size={11} style={{ color: '#6366F1' }} strokeWidth={2.5} />
                          <span className="text-[12.5px] font-bold" style={{ color: '#6366F1' }}>{rw.xp}</span>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }}
                          disabled={!canAfford}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                          style={{
                            background: canAfford ? rw.color : 'rgba(148,163,184,0.12)',
                            color: canAfford ? '#fff' : '#94A3B8',
                          }}>
                          {canAfford ? 'Olish' : 'Yetarli emas'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Premium hint */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4 rounded-2xl p-4 flex items-start gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.05))', border: '1.5px solid rgba(139,92,246,0.2)' }}
              >
                <Crown size={20} style={{ color: '#8B5CF6' }} strokeWidth={2} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>Premium a'zolik</p>
                  <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: '#64748B' }}>
                    2x XP, ekskluziv nishonlar, ustuvor ariza ko'rib chiqish va batafsil statistika.
                  </p>
                  <motion.button whileTap={{ scale: 0.95 }}
                    className="mt-2.5 px-4 py-1.5 rounded-xl text-[12px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                    Batafsil ko'rish
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="flex flex-col gap-2.5">
              <p className="text-[11.5px] font-semibold mb-1" style={{ color: '#94A3B8' }}>
                Bu oy eng faol fuqarolar
              </p>

              {leaderboard.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
                  <p className="text-[13px] font-bold" style={{ color: '#94A3B8' }}>Yuklanmoqda...</p>
                </div>
              ) : leaderboard.map((entry, i) => {
                const RANK_STYLES = [
                  { color: '#F59E0B', glow: 'rgba(245,158,11,0.25)',  BadgeIcon: Crown  },
                  { color: '#94A3B8', glow: 'rgba(148,163,184,0.2)',  BadgeIcon: Trophy },
                  { color: '#CD7C3F', glow: 'rgba(205,124,63,0.2)',   BadgeIcon: Trophy },
                ]
                const style = RANK_STYLES[i] ?? { color: '#3B82F6', glow: 'rgba(59,130,246,0.2)', BadgeIcon: Star }
                const { BadgeIcon } = style
                const isMe = entry.telegramId === myTelegramId
                return (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.28 }}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-3xl relative overflow-hidden"
                    style={{
                      background: isMe ? 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.07))' : 'rgba(255,255,255,0.9)',
                      boxShadow: isMe ? '0 4px 20px rgba(59,130,246,0.15)' : '0 2px 10px rgba(15,23,42,0.06)',
                      border: isMe ? '1.5px solid rgba(59,130,246,0.25)' : '1.5px solid rgba(255,255,255,0.7)',
                    }}
                  >
                    <div className="w-7 flex items-center justify-center shrink-0">
                      <BadgeIcon size={16} style={{ color: style.color }} strokeWidth={2.5} />
                    </div>
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black text-white shrink-0"
                      style={{ background: style.color, boxShadow: `0 4px 12px ${style.glow}` }}
                      animate={entry.rank === 1 ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {entry.firstName.charAt(0).toUpperCase()}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>{entry.firstName}</p>
                        {isMe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>Siz</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Users size={9} style={{ color: '#94A3B8' }} strokeWidth={2} />
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>{entry.reportCount} ta ariza</p>
                        <span style={{ color: '#CBD5E1' }}>·</span>
                        <span className="text-[10px] font-medium" style={{ color: getTitle(entry.xp).color }}>{getTitle(entry.xp).label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Zap size={12} style={{ color: '#F59E0B' }} strokeWidth={2.5} />
                        <span className="text-[14px] font-black" style={{ color: '#0F172A' }}>{entry.xp}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: '#94A3B8' }}>XP</p>
                    </div>
                  </motion.div>
                )
              })}

              {/* Challenge card */}
              {leaderboard.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-1 rounded-3xl p-4 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.06))', border: '1.5px solid rgba(245,158,11,0.25)', boxShadow: '0 4px 16px rgba(245,158,11,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={15} style={{ color: '#F59E0B' }} strokeWidth={2.5} />
                    <p className="text-[12.5px] font-bold" style={{ color: '#92400E' }}>
                      {leaderboard[0]?.telegramId === myTelegramId
                        ? '1-o\'rindasiz! Davom eting!'
                        : 'Oy oxirigacha 1-o\'ringa chiqing!'}
                    </p>
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: '#78350F' }}>
                    {leaderboard[0]?.telegramId === myTelegramId
                      ? 'Eng faol fuqaro sifatida jamoatingizga rahmat!'
                      : `${leaderboard[0]?.firstName ?? 'Birinchidan'} ${(leaderboard[0]?.xp ?? 0) - xp} XP orqada. Muammolarni bildirib boring!`}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
