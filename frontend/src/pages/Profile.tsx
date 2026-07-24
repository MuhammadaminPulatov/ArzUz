import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Award, ChevronRight, Star, Zap } from 'lucide-react'
import { BADGES, SAMPLE_REPORTS } from '../data/mock'

const STATUS_CONFIG = {
  sent: { label: 'Yuborildi', text: '#B45309', bg: 'rgba(245,158,11,0.1)' },
  in_progress: { label: 'Jarayonda', text: '#1D4ED8', bg: 'rgba(59,130,246,0.1)' },
  resolved: { label: 'Hal Etildi', text: '#065F46', bg: 'rgba(16,185,129,0.1)' },
}

const LEADERBOARD = [
  { rank: 1, name: 'Sardor T.', xp: 2840, badge: '👑', reports: 18, avatar: 'S', color: '#F59E0B' },
  { rank: 2, name: 'Malika R.', xp: 2210, badge: '🥈', reports: 14, avatar: 'M', color: '#94A3B8' },
  { rank: 3, name: 'Jahongir K.', xp: 1950, badge: '🥉', reports: 12, avatar: 'J', color: '#CD7C3F' },
  { rank: 4, name: 'Aziz S.', xp: 1580, badge: '⭐', reports: 9, avatar: 'A', color: '#3B82F6', isMe: true },
  { rank: 5, name: 'Nodira A.', xp: 1220, badge: '⭐', reports: 7, avatar: 'N', color: '#8B5CF6' },
]

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'reports' | 'badges' | 'leaderboard'>('reports')
  const myReports = SAMPLE_REPORTS.slice(0, 3)

  const xp = 1580
  const nextLevelXp = 2000
  const progress = (xp / nextLevelXp) * 100
  const earnedBadges = BADGES.filter(b => b.earned).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Profile Header */}
      <div
        className="px-4 pt-5 pb-4 shrink-0"
        style={{ background: 'linear-gradient(160deg, #1E40AF 0%, #3B82F6 100%)' }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shadow-blue-900/30" style={{ background: 'rgba(255,255,255,0.2)' }}>
              A
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
              <CheckCircle2 size={12} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-extrabold text-white">Aziz Sultonov</h2>
            <p className="text-[12px] text-blue-200 mt-0.5">@aziz_toshkent • Fuqaro</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Zap size={11} className="text-yellow-300" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-white">{xp} XP</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Award size={11} className="text-yellow-300" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-white">{earnedBadges} nishon</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-blue-200">Daraja</p>
            <p className="text-[22px] font-extrabold text-white">4</p>
            <p className="text-[10px] text-blue-200">Faol fuqaro</p>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-blue-200">Daraja 4</span>
            <span className="text-[11px] text-blue-200">{xp} / {nextLevelXp} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FCD34D, #F59E0B)' }}
            />
          </div>
          <p className="text-[10px] text-blue-200 mt-1">{nextLevelXp - xp} XP qoldi → Daraja 5 "Mahalla qahramoni"</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 px-4 py-3 shrink-0">
        {[
          { icon: '📋', value: 5, label: 'Ariza', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
          { icon: '✅', value: 2, label: 'Hal etildi', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
          { icon: '👍', value: 119, label: 'Ovoz', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
          { icon: '🔥', value: 3, label: 'Ketma-ket', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 rounded-xl p-2 text-center" style={{ background: stat.bg }}>
            <div className="text-base mb-0.5">{stat.icon}</div>
            <div className="text-[15px] font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[9px]" style={{ color: '#94A3B8' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Motivation message */}
      <div className="mx-4 mb-3 rounded-xl p-3 flex items-start gap-2.5 shrink-0" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <span className="text-lg shrink-0">🌟</span>
        <div>
          <p className="text-[12px] font-bold" style={{ color: '#1D4ED8' }}>Siz mahallangiz uchun yordam beryapsiz!</p>
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#64748B' }}>
            5 ta arizangiz orqali {119} kishi qo'llab-quvvatladi. Davom eting — siz farq yaratyapsiz! 💪
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex px-4 gap-1 shrink-0 mb-3">
        {([
          { id: 'reports', label: '📋 Arizalarim' },
          { id: 'badges', label: '🏆 Nishonlar' },
          { id: 'leaderboard', label: '🏅 Reyting' },
        ] as const).map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? '#3B82F6' : 'rgba(148,163,184,0.1)',
              color: activeTab === tab.id ? '#fff' : 'var(--tg-theme-hint-color, #94A3B8)',
            }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <AnimatePresence mode="wait">

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {myReports.map((r, i) => {
                const st = STATUS_CONFIG[r.status]
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: 'var(--tg-theme-secondary-bg-color, #fff)', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: r.photoColor }}>
                      {r.photoEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-bold text-blue-500">{r.id}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                      </div>
                      <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: '#94A3B8' }}>👍 {r.votes} ovoz</span>
                        <span className="text-[10px]" style={{ color: '#94A3B8' }}>• {r.createdAt}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: '#CBD5E1' }} />
                  </motion.div>
                )
              })}

              {myReports.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-4xl">📭</span>
                  <p className="text-[14px] font-semibold mt-3" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>Hali ariza yo'q</p>
                  <p className="text-[12px] mt-1" style={{ color: '#94A3B8' }}>Birinchi arizangizni yuboring!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* BADGES */}
          {activeTab === 'badges' && (
            <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 gap-3">
                {BADGES.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-3.5 relative overflow-hidden"
                    style={{
                      background: badge.earned
                        ? 'var(--tg-theme-secondary-bg-color, #fff)'
                        : 'rgba(148,163,184,0.07)',
                      boxShadow: badge.earned ? '0 2px 10px rgba(15,23,42,0.08)' : 'none',
                      border: badge.earned ? '1.5px solid rgba(59,130,246,0.15)' : '1.5px solid rgba(148,163,184,0.12)',
                      opacity: badge.earned ? 1 : 0.65,
                    }}
                  >
                    {badge.earned && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" strokeWidth={2.5} />
                      </div>
                    )}
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-[12px] font-bold leading-tight" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>{badge.name}</p>
                    <p className="text-[10px] mt-1 leading-snug" style={{ color: '#94A3B8' }}>{badge.description}</p>

                    {badge.progress !== undefined && badge.total && (
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-[9px]" style={{ color: '#94A3B8' }}>{badge.progress}/{badge.total}</span>
                          <span className="text-[9px] font-bold text-blue-500">+{badge.xpReward} XP</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.2)' }}>
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {badge.progress === undefined && (
                      <p className="text-[9px] mt-1.5 font-bold text-blue-500">+{badge.xpReward} XP</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold mb-2" style={{ color: '#94A3B8' }}>Bu oy eng faol fuqarolar</p>
              {LEADERBOARD.map((item, i) => (
                <motion.div
                  key={item.rank}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{
                    background: item.isMe
                      ? 'rgba(59,130,246,0.08)'
                      : 'var(--tg-theme-secondary-bg-color, #fff)',
                    boxShadow: '0 1px 6px rgba(15,23,42,0.06)',
                    border: item.isMe ? '1.5px solid rgba(59,130,246,0.25)' : '1.5px solid transparent',
                  }}
                >
                  <span className="text-xl w-7 text-center shrink-0">{item.badge}</span>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                    style={{ background: item.color }}
                  >
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
                      {item.name} {item.isMe && <span className="text-[10px] font-semibold text-blue-500">(Siz)</span>}
                    </p>
                    <p className="text-[10px]" style={{ color: '#94A3B8' }}>{item.reports} ta ariza</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap size={11} className="text-yellow-500" strokeWidth={2.5} />
                      <span className="text-[13px] font-extrabold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>{item.xp}</span>
                    </div>
                    <p className="text-[9px]" style={{ color: '#94A3B8' }}>XP</p>
                  </div>
                </motion.div>
              ))}

              <div className="mt-3 rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Star size={14} className="text-yellow-500" strokeWidth={2.5} />
                  <p className="text-[12px] font-bold" style={{ color: '#92400E' }}>Oy oxirigacha 420 XP to'plang!</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#78350F' }}>
                  Sardorni quvib eting — 1-o'rinni egallash uchun yana 1260 XP kerak. Muammolarni bildirib boring! 🚀
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
