import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Zap, Star, Trophy, MapPin, Shield, FileText, Award } from 'lucide-react'
import { BADGES, SAMPLE_REPORTS } from '../data/mock'

const STATUS_CONFIG = {
  sent: { label: 'Yuborildi', text: '#B45309', dot: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  in_progress: { label: 'Jarayonda', text: '#1D4ED8', dot: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  resolved: { label: 'Hal Etildi', text: '#065F46', dot: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

const LEADERBOARD = [
  { rank: 1, name: 'Sardor T.', xp: 2840, badge: '👑', reports: 18, avatar: 'S', color: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
  { rank: 2, name: 'Malika R.', xp: 2210, badge: '🥈', reports: 14, avatar: 'M', color: '#94A3B8', glow: 'rgba(148,163,184,0.2)' },
  { rank: 3, name: 'Jahongir K.', xp: 1950, badge: '🥉', reports: 12, avatar: 'J', color: '#CD7C3F', glow: 'rgba(205,124,63,0.2)' },
  { rank: 4, name: 'Aziz S.', xp: 1580, badge: '⭐', reports: 9, avatar: 'A', color: '#3B82F6', glow: 'rgba(59,130,246,0.3)', isMe: true },
  { rank: 5, name: 'Nodira A.', xp: 1220, badge: '⭐', reports: 7, avatar: 'N', color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
]

const TABS = [
  { id: 'reports',     label: 'Arizalarim', icon: FileText },
  { id: 'badges',      label: 'Nishonlar',  icon: Award },
  { id: 'leaderboard', label: 'Reyting',    icon: Trophy },
] as const

type Tab = typeof TABS[number]['id']

interface ProfileProps { onOpenAdmin: () => void }

export default function Profile({ onOpenAdmin }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('reports')
  const myReports = SAMPLE_REPORTS.slice(0, 3)

  const xp = 1580
  const nextLevelXp = 2000
  const progress = (xp / nextLevelXp) * 100
  const earnedBadges = BADGES.filter((b) => b.earned).length

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F0F4FF' }}>
      {/* ── Header ── */}
      <div
        className="px-4 pt-5 pb-5 shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)' }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', transform: 'translate(20%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-28 h-28 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', transform: 'translate(-30%, 40%)' }}
        />

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
              A
            </motion.div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
              style={{ background: '#10B981' }}
            >
              <CheckCircle2 size={11} className="text-white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[19px] font-black text-white tracking-tight">Aziz Sultonov</h2>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onOpenAdmin}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                <Shield size={10} style={{ color: '#93C5FD' }} strokeWidth={2.5} />
                <span className="text-[9px] font-bold" style={{ color: '#93C5FD' }}>Admin</span>
              </motion.button>
            </div>
            <p className="text-[11.5px] text-blue-200 mt-0.5">@aziz_toshkent · Faol fuqaro</p>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                <Zap size={11} style={{ color: '#FCD34D' }} strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-white">{xp} XP</span>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                <Trophy size={11} style={{ color: '#FCD34D' }} strokeWidth={2.5} />
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
              <span className="text-[22px] font-black text-white">4</span>
            </motion.div>
            <p className="text-[9px] text-blue-200 mt-0.5">Faol</p>
          </div>
        </div>

        {/* XP progress */}
        <div className="relative">
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-blue-200">Daraja 4</span>
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
          <p className="text-[10.5px] text-blue-200 mt-1.5">
            ⚡ {nextLevelXp - xp} XP qoldi → "Mahalla qahramoni" 🏆
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="flex gap-2.5 px-4 py-3 shrink-0">
        {[
          { icon: '📋', value: 5, label: 'Ariza', gradient: 'linear-gradient(135deg,#3B82F6,#6366F1)', shadow: 'rgba(99,102,241,0.2)' },
          { icon: '✅', value: 2, label: 'Hal etildi', gradient: 'linear-gradient(135deg,#10B981,#059669)', shadow: 'rgba(16,185,129,0.2)' },
          { icon: '👍', value: 119, label: 'Ovoz', gradient: 'linear-gradient(135deg,#8B5CF6,#6366F1)', shadow: 'rgba(139,92,246,0.2)' },
          { icon: '🔥', value: 3, label: 'Streak', gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)', shadow: 'rgba(245,158,11,0.2)' },
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
            <div className="text-base leading-none mb-1">{s.icon}</div>
            <div className="text-[16px] font-black" style={{ color: '#0F172A' }}>{s.value}</div>
            <div className="text-[9px] font-semibold mt-0.5" style={{ color: '#94A3B8' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Motivation card ── */}
      <div
        className="mx-4 mb-3 rounded-2xl p-3.5 flex items-start gap-3 shrink-0"
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(59,130,246,0.15)',
          boxShadow: '0 2px 12px rgba(59,130,246,0.08)',
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xl shrink-0"
        >
          🌟
        </motion.span>
        <div>
          <p className="text-[12.5px] font-bold" style={{ color: '#1D4ED8' }}>
            Siz mahallangiz uchun yordam beryapsiz!
          </p>
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#64748B' }}>
            5 ta arizangiz orqali 119 kishi qo'llab-quvvatladi. Davom eting! 💪
          </p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex px-4 gap-1.5 shrink-0 mb-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[11.5px] font-bold transition-all"
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
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-3"
            >
              {myReports.map((r, i) => {
                const st = STATUS_CONFIG[r.status]
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.28 }}
                    className="flex items-center gap-3 p-3.5 rounded-3xl"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 3px 16px rgba(15,23,42,0.07)',
                      border: '1px solid rgba(255,255,255,0.8)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: r.photoColor }}
                    >
                      {r.photoEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold" style={{ color: '#3B82F6' }}>{r.id}</span>
                        <span
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0F172A' }}>{r.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={10} style={{ color: '#94A3B8' }} strokeWidth={2} />
                        <span className="text-[10px] truncate" style={{ color: '#94A3B8' }}>{r.address}</span>
                        <span className="text-[10px]" style={{ color: '#CBD5E1' }}>·</span>
                        <span className="text-[10px]" style={{ color: '#94A3B8' }}>👍 {r.votes}</span>
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: '#CBD5E1' }} strokeWidth={2} />
                  </motion.div>
                )
              })}

              {myReports.length === 0 && (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    className="text-5xl mb-3"
                  >
                    📭
                  </motion.div>
                  <p className="text-[15px] font-bold" style={{ color: '#0F172A' }}>Hali ariza yo'q</p>
                  <p className="text-[12px] mt-1" style={{ color: '#94A3B8' }}>Birinchi arizangizni yuboring!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* BADGES */}
          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <div className="grid grid-cols-2 gap-3">
                {BADGES.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
                    className="rounded-3xl p-4 relative overflow-hidden"
                    style={{
                      background: badge.earned ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                      boxShadow: badge.earned
                        ? '0 4px 20px rgba(59,130,246,0.12), 0 1px 4px rgba(15,23,42,0.06)'
                        : '0 1px 4px rgba(15,23,42,0.04)',
                      border: badge.earned
                        ? '1.5px solid rgba(99,102,241,0.2)'
                        : '1.5px solid rgba(148,163,184,0.12)',
                      opacity: badge.earned ? 1 : 0.6,
                    }}
                  >
                    {badge.earned && (
                      <>
                        <div
                          className="absolute top-0 right-0 w-16 h-16 rounded-full"
                          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}
                        />
                        <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full bg-emerald-500 flex items-center justify-center" style={{ width: 18, height: 18 }}>
                          <CheckCircle2 size={10} className="text-white" strokeWidth={2.5} />
                        </div>
                      </>
                    )}

                    <motion.div
                      className="text-4xl mb-2.5"
                      animate={badge.earned ? { scale: [1, 1.06, 1] } : { scale: 1 }}
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
                      <p className="text-[9px] mt-2 font-bold" style={{ color: '#6366F1' }}>+{badge.xpReward} XP</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-2.5"
            >
              <p className="text-[11.5px] font-semibold mb-1" style={{ color: '#94A3B8' }}>
                Bu oy eng faol fuqarolar
              </p>

              {LEADERBOARD.map((item, i) => (
                <motion.div
                  key={item.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.28 }}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-3xl relative overflow-hidden"
                  style={{
                    background: item.isMe
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.07))'
                      : 'rgba(255,255,255,0.9)',
                    boxShadow: item.isMe
                      ? `0 4px 20px rgba(59,130,246,0.15)`
                      : '0 2px 10px rgba(15,23,42,0.06)',
                    border: item.isMe
                      ? '1.5px solid rgba(59,130,246,0.25)'
                      : '1.5px solid rgba(255,255,255,0.7)',
                  }}
                >
                  {item.isMe && (
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.04), transparent)' }}
                    />
                  )}

                  <span className="text-xl w-7 text-center shrink-0 relative">{item.badge}</span>

                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black text-white shrink-0 relative"
                    style={{
                      background: item.color,
                      boxShadow: `0 4px 12px ${item.glow}`,
                    }}
                    animate={item.rank === 1 ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {item.avatar}
                  </motion.div>

                  <div className="flex-1 min-w-0 relative">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>{item.name}</p>
                      {item.isMe && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}
                        >
                          Siz
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>{item.reports} ta ariza</p>
                  </div>

                  <div className="text-right relative">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap size={12} style={{ color: '#F59E0B' }} strokeWidth={2.5} />
                      <span className="text-[14px] font-black" style={{ color: '#0F172A' }}>{item.xp}</span>
                    </div>
                    <p className="text-[9px]" style={{ color: '#94A3B8' }}>XP</p>
                  </div>
                </motion.div>
              ))}

              {/* Challenge card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-1 rounded-3xl p-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.06))',
                  border: '1.5px solid rgba(245,158,11,0.25)',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.1)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Star size={15} style={{ color: '#F59E0B' }} strokeWidth={2.5} />
                  <p className="text-[12.5px] font-bold" style={{ color: '#92400E' }}>
                    Oy oxirigacha 1-o'ringa chiqing!
                  </p>
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: '#78350F' }}>
                  Sardordan 1260 XP orqada. Har bir ariza siz uchun qadam — muammolarni bildirib boring! 🚀
                </p>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
