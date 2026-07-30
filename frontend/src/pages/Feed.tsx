import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, X, ThumbsUp, CheckCircle2, Zap, SlidersHorizontal } from 'lucide-react'
import ReportCard from '../components/ReportCard'
import NotificationDrawer from '../components/NotificationDrawer'
import ReportDetailModal from '../components/ReportDetailModal'
import { CATEGORIES } from '../data/mock'
import { useReports } from '../hooks/useReports'
import { useVote } from '../hooks/useVote'
import { useNotifications } from '../hooks/useNotifications'
import { useSSE } from '../hooks/useSSE'
import { getToken } from '../lib/api'
import type { Report } from '../types'

const STATUS_FILTERS = [
  { id: 'all',         label: 'Barchasi',   dot: '' },
  { id: 'high',        label: 'Shoshilinch', dot: '#EF4444' },
  { id: 'in_progress', label: 'Jarayonda',  dot: '#3B82F6' },
  { id: 'resolved',    label: 'Hal etildi', dot: '#10B981' },
  { id: 'near',        label: 'Yaqinimda',  dot: '#8B5CF6' },
]

const STAT_CONFIGS = [
  { key: 'votes',    label: 'Jami ovoz',  icon: ThumbsUp,     color: '#3B82F6', shadow: 'rgba(59,130,246,0.18)' },
  { key: 'resolved', label: 'Hal etildi', icon: CheckCircle2, color: '#10B981', shadow: 'rgba(16,185,129,0.18)' },
  { key: 'progress', label: 'Jarayonda',  icon: Zap,          color: '#F59E0B', shadow: 'rgba(245,158,11,0.18)' },
]

export default function Feed() {
  const { reports: rawReports, loading, addReport, updateReport } = useReports()
  const { reports, handleVote } = useVote(rawReports)
  const { notifications, unread } = useNotifications()
  const sse = useSSE(getToken())

  useEffect(() => {
    const unCreated = sse.on('ticket:created', (data) => addReport(data as Report))
    const unUpdated = sse.on('ticket:updated', (data) => {
      const d = data as { ticketId: string; status: Report['status'] }
      updateReport(d.ticketId, { status: d.status })
    })
    const unVoted = sse.on('ticket:voted', (data) => {
      const d = data as { ticketId: string; votes: number }
      updateReport(d.ticketId, { votes: d.votes })
    })
    return () => { unCreated(); unUpdated(); unVoted() }
  }, [sse, addReport, updateReport])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const filtered = reports.filter((r) => {
    const matchSearch =
      search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      !activeCategory || r.category === CATEGORIES.find((c) => c.id === activeCategory)?.label
    const matchFilter =
      activeFilter === 'all' ||
      (activeFilter === 'high' && r.severity === 'high') ||
      (activeFilter === 'in_progress' && r.status === 'in_progress') ||
      (activeFilter === 'resolved' && r.status === 'resolved') ||
      activeFilter === 'near'
    return matchSearch && matchCategory && matchFilter
  })

  const totalVotes = reports.reduce((s, r) => s + r.votes, 0)
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length
  const statValues = [totalVotes, resolvedCount, inProgressCount]

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ background: '#F2F2F7' }}>
      <NotificationDrawer
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
      />
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onVote={(id) => { handleVote(id); setSelectedReport(r => r?.id === id ? { ...r, hasVoted: !r.hasVoted, votes: r.hasVoted ? r.votes - 1 : r.votes + 1 } : r) }}
      />

      {/* Header */}
      <div className="px-4 pt-5 pb-0 shrink-0" style={{ background: '#F2F2F7' }}>
        {/* Title row */}
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h1 className="text-[26px] font-black tracking-tight leading-tight" style={{ color: '#1C1C1E', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
              Mahalla
            </h1>
            <p className="text-[12px] font-medium" style={{ color: '#8E8E93' }}>
              {reports.length} ta muammo · birga yaxshilaymiz
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(15,23,42,0.1)', border: '1px solid rgba(226,232,240,0.6)' }}
          >
            <Bell size={17} style={{ color: '#3B82F6' }} strokeWidth={2.2} />
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white"
                style={{ background: '#EF4444' }}
              >
                {unread}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Stat row — compact iOS style */}
        <div className="flex gap-2 mb-3.5">
          {STAT_CONFIGS.map((cfg, i) => {
            const Icon = cfg.icon
            return (
              <motion.div
                key={cfg.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(0,0,0,0.07)' }}
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg.color}18` }}>
                  <Icon size={13} strokeWidth={2.2} style={{ color: cfg.color }} />
                </div>
                <div>
                  <motion.div
                    key={statValues[i]}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[16px] font-black leading-none"
                    style={{ color: '#1C1C1E' }}
                  >
                    {loading ? '—' : statValues[i]}
                  </motion.div>
                  <div className="text-[9px] font-semibold mt-0.5" style={{ color: '#8E8E93' }}>{cfg.label}</div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Search — iOS style */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} style={{ color: '#8E8E93' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {}}
            onBlur={() => {}}
            placeholder="Qidirish..."
            className="w-full pl-8.5 pr-8 py-2 rounded-[10px] text-[15px] outline-none"
            style={{
              background: 'rgba(118,118,128,0.12)',
              color: '#1C1C1E',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
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
                style={{ background: 'rgba(148,163,184,0.18)' }}
              >
                <X size={11} style={{ color: '#64748B' }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1.5" style={{ scrollbarWidth: 'none' }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-[11.5px] font-bold"
            style={{
              background: !activeCategory ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : '#fff',
              color: !activeCategory ? '#fff' : '#64748B',
              boxShadow: !activeCategory ? '0 4px 12px rgba(99,102,241,0.28)' : '0 1px 4px rgba(15,23,42,0.06)',
              border: !activeCategory ? 'none' : '1px solid rgba(226,232,240,0.8)',
            }}
          >
            <SlidersHorizontal size={11} strokeWidth={2.5} />
            Barchasi
          </motion.button>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <motion.button
                whileTap={{ scale: 0.92 }}
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-[11.5px] font-bold"
                style={{
                  background: isActive ? cat.color : '#fff',
                  color: isActive ? '#fff' : '#64748B',
                  boxShadow: isActive ? `0 4px 12px ${cat.color}44` : '0 1px 4px rgba(15,23,42,0.06)',
                  border: isActive ? 'none' : '1px solid rgba(226,232,240,0.8)',
                }}
              >
                {cat.icon} {cat.label}
              </motion.button>
            )
          })}
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map((f) => {
            const isActive = activeFilter === f.id
            return (
              <motion.button
                whileTap={{ scale: 0.9 }}
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 text-[11px] font-semibold"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                  color: isActive ? '#3B82F6' : '#94A3B8',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.22)' : 'rgba(226,232,240,0.8)'}`,
                }}
              >
                {f.dot && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.dot }} />
                )}
                {f.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 flex flex-col gap-3 pt-2" style={{ background: '#F2F2F7' }}>
        {loading ? (
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden h-48 shimmer" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <Search size={48} className="mb-4" style={{ color: '#CBD5E1' }} strokeWidth={1.5} />
                <p className="text-[15px] font-bold" style={{ color: '#0F172A' }}>Hech narsa topilmadi</p>
                <p className="text-[12.5px] mt-1.5" style={{ color: '#94A3B8' }}>Qidiruv yoki filtrni o'zgartiring</p>
              </motion.div>
            ) : (
              filtered.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  onClick={() => setSelectedReport(reports.find(r => r.id === report.id) ?? report)}
                  style={{ cursor: 'pointer' }}
                >
                  <ReportCard report={report} onVote={handleVote} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
