import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, ChevronUp, ChevronDown, Users } from 'lucide-react'
import type { Report } from '../data/mock'

const STATUS_CONFIG = {
  sent: { label: '⏳ Yuborildi', text: '#B45309', bg: 'rgba(245,158,11,0.12)' },
  in_progress: { label: '🔵 Jarayonda', text: '#1D4ED8', bg: 'rgba(59,130,246,0.12)' },
  resolved: { label: '✅ Hal Etildi', text: '#065F46', bg: 'rgba(16,185,129,0.12)' },
}

const SEVERITY_CONFIG = {
  high: { label: '🔴 Yuqori', color: '#EF4444' },
  medium: { label: '🟡 O\'rta', color: '#F59E0B' },
  low: { label: '🟢 Past', color: '#10B981' },
}

interface ReportCardProps {
  report: Report
  onVote: (id: string) => void
  onExpand?: () => void
  compact?: boolean
}

export default function ReportCard({ report, onVote, compact }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[report.status]
  const severity = SEVERITY_CONFIG[report.severity]

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--tg-theme-secondary-bg-color, #ffffff)',
        boxShadow: '0 2px 12px rgba(15,23,42,0.07)',
        border: '1px solid rgba(148,163,184,0.1)',
      }}
    >
      {/* Photo / Emoji header */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: compact ? 80 : 120, background: report.photoColor }}
      >
        <span className="text-5xl">{report.photoEmoji}</span>
        <div className="absolute top-2.5 left-2.5">
          <span
            className="text-[11px] font-bold px-2 py-1 rounded-lg"
            style={{
              background: report.categoryColor,
              color: '#fff',
            }}
          >
            {report.categoryIcon} {report.category}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-lg"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold leading-snug" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
              {report.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: '#3B82F6' }}
              >
                {report.userAvatar}
              </div>
              <span className="text-[11px]" style={{ color: 'var(--tg-theme-hint-color, #64748B)' }}>
                {report.username}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--tg-theme-hint-color, #94A3B8)' }}>•</span>
              <span className="text-[11px]" style={{ color: 'var(--tg-theme-hint-color, #94A3B8)' }}>{report.createdAt}</span>
            </div>
          </div>

          {/* Vote button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onVote(report.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl shrink-0 transition-all"
            style={{
              background: report.hasVoted ? 'rgba(59,130,246,0.12)' : 'rgba(148,163,184,0.1)',
              minWidth: 52,
              minHeight: 52,
            }}
          >
            <motion.div animate={{ scale: report.hasVoted ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.3 }}>
              <ChevronUp
                size={18}
                strokeWidth={2.5}
                style={{ color: report.hasVoted ? '#3B82F6' : '#94A3B8' }}
              />
            </motion.div>
            <span
              className="text-[14px] font-bold leading-none"
              style={{ color: report.hasVoted ? '#3B82F6' : '#64748B' }}
            >
              {report.votes}
            </span>
            <span className="text-[9px] font-medium" style={{ color: report.hasVoted ? '#3B82F6' : '#94A3B8' }}>
              ovoz
            </span>
          </motion.button>
        </div>

        {/* Supporters */}
        {report.supporterAvatars.length > 0 && (
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex -space-x-2">
              {report.supporterAvatars.slice(0, 4).map((a, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: `hsl(${i * 60 + 200}, 70%, 55%)`, borderColor: 'var(--tg-theme-secondary-bg-color, #fff)' }}
                >
                  {a}
                </div>
              ))}
            </div>
            <span className="text-[11px]" style={{ color: 'var(--tg-theme-hint-color, #64748B)' }}>
              <Users size={9} className="inline mr-0.5" strokeWidth={2.5} />
              {report.votes} kishi bu muammoda
            </span>
          </div>
        )}

        {/* Location & severity */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <MapPin size={10} className="shrink-0" style={{ color: '#3B82F6' }} strokeWidth={2.5} />
            <span className="text-[11px] truncate" style={{ color: 'var(--tg-theme-hint-color, #64748B)' }}>
              {report.address}
            </span>
          </div>
          <span className="text-[10px] font-medium shrink-0" style={{ color: severity.color }}>
            {severity.label}
          </span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-medium"
          style={{ color: '#3B82F6' }}
        >
          {expanded ? <ChevronUp size={12} strokeWidth={2.5} /> : <ChevronDown size={12} strokeWidth={2.5} />}
          {expanded ? 'Yopish' : 'Batafsil ko\'rish'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t mt-2.5" style={{ borderColor: 'rgba(148,163,184,0.12)' }}>
                <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: 'var(--tg-theme-text-color, #334155)' }}>
                  {report.description}
                </p>
                {/* AI Summary */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">✨ AI Tahlili</span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--tg-theme-text-color, #334155)' }}>
                    {report.aiSummary}
                  </p>
                </div>
                <p className="text-[10px] mt-2.5 flex items-center gap-1" style={{ color: '#94A3B8' }}>
                  <Clock size={9} strokeWidth={2} />
                  {report.id} • {report.createdAt}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
