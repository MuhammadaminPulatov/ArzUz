import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, ChevronUp, ChevronDown, Users, Sparkles } from 'lucide-react'
import type { Report } from '../types'

const STATUS_CONFIG = {
  sent: { label: 'Yuborildi', text: '#92400E', bg: 'rgba(245,158,11,0.12)', dot: '#F59E0B' },
  in_progress: { label: 'Jarayonda', text: '#1E40AF', bg: 'rgba(59,130,246,0.12)', dot: '#3B82F6' },
  resolved: { label: 'Hal Etildi', text: '#065F46', bg: 'rgba(16,185,129,0.12)', dot: '#10B981' },
}

const SEVERITY_GRADIENT = {
  high: 'linear-gradient(90deg, #EF4444, #F97316)',
  medium: 'linear-gradient(90deg, #F59E0B, #EAB308)',
  low: 'linear-gradient(90deg, #10B981, #22C55E)',
}

interface ReportCardProps {
  report: Report
  onVote: (id: string) => void
  compact?: boolean
}

export default function ReportCard({ report, onVote, compact }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [votePop, setVotePop] = useState(false)
  const status = STATUS_CONFIG[report.status]

  const handleVote = () => {
    setVotePop(true)
    setTimeout(() => setVotePop(false), 400)
    onVote(report.id)
    ;(window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
  }

  return (
    <motion.div
      layout
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)',
        border: '1px solid rgba(255,255,255,0.8)',
      }}
    >
      {/* Severity stripe */}
      <div className="h-0.5 w-full" style={{ background: SEVERITY_GRADIENT[report.severity] }} />

      {/* Photo header */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ height: compact ? 88 : 128, background: `linear-gradient(160deg, ${report.photoColor}, ${report.photoColor}dd)` }}
      >
        <motion.span
          className="text-6xl select-none"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {report.photoEmoji}
        </motion.span>

        {/* Category pill */}
        <div className="absolute top-3 left-3">
          <span
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl text-white shadow-sm"
            style={{ background: report.categoryColor }}
          >
            {report.categoryIcon} {report.category}
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.9)', color: status.text, backdropFilter: 'blur(8px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: status.dot }} />
            {status.label}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Title + Vote */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[14.5px] font-bold leading-snug mb-1.5" style={{ color: '#0F172A' }}>
              {report.title}
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm"
                style={{ background: `hsl(${report.userId.charCodeAt(1) * 37}, 65%, 52%)` }}
              >
                {report.userAvatar}
              </div>
              <span className="text-[11px] font-medium" style={{ color: '#475569' }}>{report.username}</span>
              <span className="text-[11px]" style={{ color: '#CBD5E1' }}>·</span>
              <Clock size={9} style={{ color: '#94A3B8' }} strokeWidth={2} />
              <span className="text-[10px]" style={{ color: '#94A3B8' }}>{report.createdAt}</span>
            </div>
          </div>

          {/* Vote button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleVote}
            className="flex flex-col items-center gap-0.5 rounded-2xl shrink-0 relative overflow-hidden"
            style={{
              minWidth: 54,
              minHeight: 58,
              background: report.hasVoted
                ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.12))'
                : 'rgba(148,163,184,0.09)',
              border: `1.5px solid ${report.hasVoted ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.2)'}`,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            <motion.div
              animate={report.hasVoted ? { y: [-2, 0] } : { y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={votePop ? 'vote-pop' : ''}
            >
              <ChevronUp
                size={20}
                strokeWidth={2.5}
                style={{ color: report.hasVoted ? '#3B82F6' : '#94A3B8' }}
              />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.span
                key={report.votes}
                initial={{ y: report.hasVoted ? -6 : 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[15px] font-black leading-none"
                style={{ color: report.hasVoted ? '#3B82F6' : '#475569' }}
              >
                {report.votes}
              </motion.span>
            </AnimatePresence>
            <span className="text-[9px] font-semibold" style={{ color: report.hasVoted ? '#3B82F6' : '#94A3B8' }}>
              ovoz
            </span>
          </motion.button>
        </div>

        {/* Supporter avatars */}
        {report.supporterAvatars.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-1.5">
              {report.supporterAvatars.slice(0, 5).map((a, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white"
                  style={{
                    background: `hsl(${i * 55 + 195}, 68%, 52%)`,
                    borderColor: 'rgba(255,255,255,0.9)',
                    zIndex: 5 - i,
                  }}
                >
                  {a}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>
              <Users size={10} className="inline mr-1" strokeWidth={2} />
              {report.votes} kishi bu muammoda
            </span>
          </div>
        )}

        {/* Address */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={11} style={{ color: '#3B82F6' }} strokeWidth={2.5} />
          <span className="text-[11.5px] truncate" style={{ color: '#64748B' }}>{report.address}</span>
        </div>

        {/* Expand */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11.5px] font-semibold w-full"
          style={{ color: '#3B82F6' }}
        >
          {expanded ? <ChevronUp size={13} strokeWidth={2.5} /> : <ChevronDown size={13} strokeWidth={2.5} />}
          {expanded ? "Yopish" : "Batafsil ko'rish"}
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: '#334155' }}>
                  {report.description}
                </p>

                {/* AI summary */}
                <div
                  className="rounded-2xl p-3.5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(99,102,241,0.05))',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} style={{ color: '#6366F1' }} strokeWidth={2} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366F1' }}>
                      AI Tahlili
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: '#334155' }}>
                    {report.aiSummary}
                  </p>
                </div>

                <p className="text-[10px] mt-3 flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                    style={{ background: 'rgba(148,163,184,0.12)', color: '#64748B' }}
                  >
                    {report.id}
                  </span>
                  {report.createdAt}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
