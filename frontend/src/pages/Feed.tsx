import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, TrendingUp, X } from 'lucide-react'
import ReportCard from '../components/ReportCard'
import { SAMPLE_REPORTS, CATEGORIES } from '../data/mock'
import { useVote } from '../hooks/useVote'

const FILTERS = ['Barchasi', 'Yuqori', "Jarayonda", 'Hal Etildi', 'Yaqinimda']

export default function Feed() {
  const { reports, handleVote } = useVote(SAMPLE_REPORTS)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Barchasi')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = reports.filter((r) => {
    const matchSearch = search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !activeCategory || r.category === CATEGORIES.find(c => c.id === activeCategory)?.label
    const matchFilter =
      activeFilter === 'Barchasi' ||
      (activeFilter === 'Yuqori' && r.severity === 'high') ||
      (activeFilter === 'Jarayonda' && r.status === 'in_progress') ||
      (activeFilter === 'Hal Etildi' && r.status === 'resolved') ||
      activeFilter === 'Yaqinimda'
    return matchSearch && matchCategory && matchFilter
  })

  const totalVotes = reports.reduce((s, r) => s + r.votes, 0)
  const resolvedCount = reports.filter(r => r.status === 'resolved').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[20px] font-extrabold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
              Mahalla Muammolari
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--tg-theme-hint-color, #64748B)' }}>
              Birga yaxshilaymiz • {reports.length} ta muammo
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Bell size={17} style={{ color: '#3B82F6' }} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Stats strip */}
        <div className="flex gap-2 mb-3">
          {[
            { icon: '👥', value: totalVotes, label: 'Umumiy ovoz' },
            { icon: '✅', value: resolvedCount, label: 'Hal Etildi' },
            { icon: '⚡', value: reports.filter(r => r.status === 'in_progress').length, label: 'Jarayonda' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 rounded-xl p-2.5 text-center"
              style={{ background: 'var(--tg-theme-secondary-bg-color, #EFF6FF)' }}
            >
              <div className="text-base leading-none mb-0.5">{stat.icon}</div>
              <div className="text-[16px] font-extrabold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
                {stat.value}
              </div>
              <div className="text-[9px]" style={{ color: '#64748B' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Muammo yoki manzil qidiring..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl text-[13px] outline-none"
            style={{
              background: 'var(--tg-theme-secondary-bg-color, #F1F5F9)',
              color: 'var(--tg-theme-text-color, #0F172A)',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} style={{ color: '#94A3B8' }} />
            </button>
          )}
        </div>

        {/* Category scroll */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-[12px] font-semibold transition-all"
            style={{
              background: !activeCategory ? '#3B82F6' : 'rgba(148,163,184,0.1)',
              color: !activeCategory ? '#fff' : 'var(--tg-theme-hint-color, #64748B)',
            }}
          >
            <TrendingUp size={11} strokeWidth={2.5} />
            Barchasi
          </motion.button>
          {CATEGORIES.map((cat) => (
            <motion.button
              whileTap={{ scale: 0.92 }}
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-[12px] font-semibold transition-all"
              style={{
                background: activeCategory === cat.id ? cat.color : 'rgba(148,163,184,0.1)',
                color: activeCategory === cat.id ? '#fff' : 'var(--tg-theme-hint-color, #64748B)',
              }}
            >
              {cat.icon} {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map((f) => (
            <motion.button
              whileTap={{ scale: 0.9 }}
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1 rounded-full shrink-0 text-[11px] font-medium transition-all"
              style={{
                background: activeFilter === f ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: activeFilter === f ? '#3B82F6' : 'var(--tg-theme-hint-color, #94A3B8)',
                border: `1px solid ${activeFilter === f ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.2)'}`,
              }}
            >
              {f}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <span className="text-5xl mb-3">🔍</span>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
                Hech narsa topilmadi
              </p>
              <p className="text-[13px] mt-1" style={{ color: '#94A3B8' }}>Qidiruv yoki filtrni o'zgartiring</p>
            </motion.div>
          ) : (
            filtered.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
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
