import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, Flame, X } from 'lucide-react'
import ReportCard from '../components/ReportCard'
import { SAMPLE_REPORTS, CATEGORIES } from '../data/mock'
import { useVote } from '../hooks/useVote'

const FILTERS = [
  { id: 'Barchasi', label: 'Barchasi', emoji: '🗂' },
  { id: 'Yuqori', label: 'Shoshilinch', emoji: '🔴' },
  { id: 'Jarayonda', label: 'Jarayonda', emoji: '🔵' },
  { id: 'Hal Etildi', label: 'Hal etildi', emoji: '✅' },
  { id: 'Yaqinimda', label: 'Yaqinimda', emoji: '📍' },
]

const STAT_CONFIGS = [
  { key: 'votes', icon: '👥', label: 'Jami ovoz', gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)', shadow: 'rgba(99,102,241,0.25)' },
  { key: 'resolved', icon: '✅', label: 'Hal etildi', gradient: 'linear-gradient(135deg, #10B981, #059669)', shadow: 'rgba(16,185,129,0.25)' },
  { key: 'progress', icon: '⚡', label: 'Jarayonda', gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', shadow: 'rgba(245,158,11,0.25)' },
]

export default function Feed() {
  const { reports, handleVote } = useVote(SAMPLE_REPORTS)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Barchasi')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)

  const filtered = reports.filter((r) => {
    const matchSearch =
      search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      !activeCategory || r.category === CATEGORIES.find((c) => c.id === activeCategory)?.label
    const matchFilter =
      activeFilter === 'Barchasi' ||
      (activeFilter === 'Yuqori' && r.severity === 'high') ||
      (activeFilter === 'Jarayonda' && r.status === 'in_progress') ||
      (activeFilter === 'Hal Etildi' && r.status === 'resolved') ||
      activeFilter === 'Yaqinimda'
    return matchSearch && matchCategory && matchFilter
  })

  const totalVotes = reports.reduce((s, r) => s + r.votes, 0)
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length

  const statValues = [totalVotes, resolvedCount, inProgressCount]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--tg-theme-bg-color, #F0F4FF)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1
                className="text-[21px] font-black tracking-tight"
                style={{ color: '#0F172A' }}
              >
                Mahalla Muammolari
              </h1>
            </div>
            <p className="text-[12px] font-medium" style={{ color: '#64748B' }}>
              Birga yaxshilaymiz · {reports.length} ta muammo
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(15,23,42,0.1)', border: '1px solid rgba(148,163,184,0.15)' }}
          >
            <Bell size={18} style={{ color: '#3B82F6' }} strokeWidth={2.2} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: '#EF4444' }}
            />
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="flex gap-2.5 mb-4">
          {STAT_CONFIGS.map((cfg, i) => (
            <motion.div
              key={cfg.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex-1 rounded-2xl p-3 text-center relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.9)',
                boxShadow: `0 4px 16px ${cfg.shadow}, 0 1px 4px rgba(15,23,42,0.06)`,
                border: '1px solid rgba(255,255,255,0.8)',
              }}
            >
              <div
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl"
                style={{ background: cfg.gradient }}
              />
              <div className="text-lg leading-none mb-1">{cfg.icon}</div>
              <motion.div
                key={statValues[i]}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[18px] font-black"
                style={{ color: '#0F172A' }}
              >
                {statValues[i]}
              </motion.div>
              <div className="text-[9px] font-semibold mt-0.5" style={{ color: '#94A3B8' }}>
                {cfg.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <motion.div
          animate={{ scale: searchFocused ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
          className="relative mb-3"
        >
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: searchFocused ? '#3B82F6' : '#94A3B8', transition: 'color 0.2s' }}
            strokeWidth={2}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Muammo yoki manzil qidiring..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl text-[13px] outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.9)',
              color: '#0F172A',
              border: `1.5px solid ${searchFocused ? 'rgba(59,130,246,0.4)' : 'rgba(148,163,184,0.18)'}`,
              boxShadow: searchFocused ? '0 0 0 3px rgba(59,130,246,0.1)' : '0 1px 6px rgba(15,23,42,0.06)',
            }}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(148,163,184,0.2)' }}
              >
                <X size={11} style={{ color: '#64748B' }} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-[11.5px] font-bold transition-all"
            style={{
              background: !activeCategory
                ? 'linear-gradient(135deg, #3B82F6, #6366F1)'
                : 'rgba(255,255,255,0.8)',
              color: !activeCategory ? '#fff' : '#64748B',
              boxShadow: !activeCategory ? '0 4px 12px rgba(99,102,241,0.3)' : '0 1px 4px rgba(15,23,42,0.06)',
              border: !activeCategory ? 'none' : '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <Flame size={12} strokeWidth={2.5} />
            Barchasi
          </motion.button>

          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <motion.button
                whileTap={{ scale: 0.92 }}
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-[11.5px] font-bold transition-all"
                style={{
                  background: isActive ? cat.color : 'rgba(255,255,255,0.8)',
                  color: isActive ? '#fff' : '#64748B',
                  boxShadow: isActive ? `0 4px 12px ${cat.color}55` : '0 1px 4px rgba(15,23,42,0.06)',
                  border: isActive ? 'none' : '1px solid rgba(148,163,184,0.2)',
                }}
              >
                {cat.icon} {cat.label}
              </motion.button>
            )
          })}
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id
            return (
              <motion.button
                whileTap={{ scale: 0.9 }}
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full shrink-0 text-[11px] font-semibold transition-all"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: isActive ? '#3B82F6' : '#94A3B8',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.18)'}`,
                }}
              >
                <span>{f.emoji}</span>
                {f.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 flex flex-col gap-3 pt-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className="text-6xl mb-4"
              >
                🔍
              </motion.div>
              <p className="text-[16px] font-bold" style={{ color: '#0F172A' }}>
                Hech narsa topilmadi
              </p>
              <p className="text-[13px] mt-1.5" style={{ color: '#94A3B8' }}>
                Qidiruv yoki filtrni o'zgartiring
              </p>
            </motion.div>
          ) : (
            filtered.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ delay: i * 0.05, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              >
                <ReportCard report={report} onVote={handleVote} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
