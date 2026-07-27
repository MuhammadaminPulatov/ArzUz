import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MapPin, ThumbsUp, Share2, CheckCircle2, Clock, Send,
  AlertTriangle, ChevronRight, MessageSquare, Eye,
} from 'lucide-react'
import type { Report } from '../types'

const STATUS_STEPS = [
  { key: 'sent',        label: 'Yuborildi',  Icon: Send },
  { key: 'in_progress', label: 'Jarayonda',  Icon: Clock },
  { key: 'resolved',    label: 'Hal etildi', Icon: CheckCircle2 },
] as const

const SEVERITY = {
  low:    { label: "Oddiy",  color: '#10B981', bg: 'rgba(16,185,129,0.1)',  stripe: '#10B981' },
  medium: { label: "O'rta",  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  stripe: '#F59E0B' },
  high:   { label: 'Yuqori', color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   stripe: '#EF4444' },
}

const STATUS_CONFIG: Record<string, { color: string; text: string }> = {
  new:         { color: '#F59E0B', text: "Ariza qabul qilindi"                   },
  sent:        { color: '#F59E0B', text: "Mahalla inspektori ko'rib chiqmoqda"  },
  in_progress: { color: '#3B82F6', text: "Tegishli bo'lim ishni boshladi"        },
  resolved:    { color: '#10B981', text: 'Muammo muvaffaqiyatli hal etildi'       },
}

interface Props {
  report: Report | null
  onClose: () => void
  onVote: (id: string) => void
}

export default function ReportDetailModal({ report, onClose, onVote }: Props) {
  const [shared, setShared] = useState(false)

  const handleShare = () => {
    if (navigator.share && report) {
      navigator.share({ title: report.title, text: report.description }).catch(() => {})
    }
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const sev = report ? SEVERITY[report.severity] : SEVERITY.medium
  const currentStepIdx = report ? STATUS_STEPS.findIndex(s => s.key === report.status) : 0
  const statusInfo = report ? (STATUS_CONFIG[report.status] ?? STATUS_CONFIG.sent) : STATUS_CONFIG.sent

  return (
    <AnimatePresence>
      {report && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: '92vh', background: '#F8FAFC' }}
          >
            {/* Photo / color banner */}
            <div
              className="relative shrink-0"
              style={{
                height: 200,
                background: `linear-gradient(160deg, ${report.categoryColor}22, ${report.categoryColor}55)`,
              }}
            >
              {/* Severity stripe top */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: sev.stripe }} />

              {/* Category emoji */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.15 }}
                  className="text-[80px] select-none"
                  style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
                >
                  {report.photoEmoji}
                </motion.div>
              </div>

              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
                <span
                  className="text-[10px] font-black px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.92)', color: '#3B82F6' }}
                >
                  {report.id}
                </span>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
                >
                  <X size={17} strokeWidth={2.5} style={{ color: '#0F172A' }} />
                </motion.button>
              </div>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="px-4 pb-32">

                {/* Title + category */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <h2 className="text-[18px] font-black leading-tight" style={{ color: '#0F172A' }}>
                      {report.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="text-[10.5px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${report.categoryColor}18`, color: report.categoryColor }}
                      >
                        {report.categoryIcon} {report.category}
                      </span>
                      <span
                        className="text-[10.5px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ background: sev.bg, color: sev.color }}
                      >
                        <AlertTriangle size={10} strokeWidth={2.5} />
                        {sev.label} og'irlik
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status timeline */}
                <div
                  className="rounded-2xl p-4 mb-3"
                  style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
                >
                  <div className="flex items-center gap-0 mb-2">
                    {STATUS_STEPS.map((step, i) => {
                      const isDone = i <= currentStepIdx
                      const isCurrent = i === currentStepIdx
                      const Icon = step.Icon
                      return (
                        <div key={step.key} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center gap-1">
                            <motion.div
                              animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                              transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{
                                background: isDone ? statusInfo.color : 'rgba(148,163,184,0.15)',
                                boxShadow: isCurrent ? `0 0 0 4px ${statusInfo.color}22` : 'none',
                              }}
                            >
                              <Icon size={14} strokeWidth={2.5} style={{ color: isDone ? '#fff' : '#CBD5E1' }} />
                            </motion.div>
                            <span className="text-[9.5px] font-bold text-center" style={{ color: isDone ? '#0F172A' : '#CBD5E1' }}>
                              {step.label}
                            </span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div
                              className="flex-1 h-0.5 mx-1 -mt-4"
                              style={{ background: i < currentStepIdx ? statusInfo.color : 'rgba(148,163,184,0.2)' }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-center mt-1" style={{ color: '#64748B' }}>{statusInfo.text}</p>
                </div>

                {/* Description */}
                <div
                  className="rounded-2xl p-4 mb-3"
                  style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={13} strokeWidth={2.5} style={{ color: '#3B82F6' }} />
                    <p className="text-[11px] font-bold" style={{ color: '#64748B' }}>TAVSIF</p>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#334155' }}>{report.description}</p>
                </div>

                {/* AI Summary */}
                {report.aiSummary && (
                  <div
                    className="rounded-2xl p-4 mb-3"
                    style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Eye size={13} strokeWidth={2.5} style={{ color: '#3B82F6' }} />
                      <p className="text-[11px] font-bold" style={{ color: '#3B82F6' }}>TIZIM TAHLILI</p>
                    </div>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: '#334155' }}>{report.aiSummary}</p>
                  </div>
                )}

                {/* Location */}
                <div
                  className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-3"
                  style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <MapPin size={15} strokeWidth={2.5} style={{ color: '#3B82F6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>MANZIL</p>
                    <p className="text-[12.5px] font-medium truncate" style={{ color: '#334155' }}>{report.address}</p>
                  </div>
                  <ChevronRight size={14} strokeWidth={2} style={{ color: '#CBD5E1' }} />
                </div>

                {/* Meta */}
                <div
                  className="rounded-2xl p-4 mb-4"
                  style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] font-black"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff' }}
                    >
                      {report.userAvatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-[12.5px] font-bold" style={{ color: '#0F172A' }}>{report.username}</p>
                      <p className="text-[10.5px]" style={{ color: '#94A3B8' }}>{report.createdAt}</p>
                    </div>
                  </div>

                  {report.supporterAvatars.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                      <div className="flex -space-x-1.5">
                        {report.supporterAvatars.slice(0, 5).map((av, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white"
                            style={{ background: `hsl(${i * 60 + 200}, 70%, 55%)`, color: '#fff' }}
                          >
                            {av}
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px]" style={{ color: '#64748B' }}>
                        va yana {report.votes - report.supporterAvatars.slice(0, 5).length} kishi qo'llab-quvvatladi
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div
              className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3"
              style={{
                background: 'rgba(248,250,252,0.96)',
                backdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(226,232,240,0.6)',
              }}
            >
              <div className="flex gap-3">
                {/* Vote button */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onVote(report.id)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13.5px]"
                  style={{
                    background: report.hasVoted
                      ? 'linear-gradient(135deg, #3B82F6, #6366F1)'
                      : '#fff',
                    color: report.hasVoted ? '#fff' : '#64748B',
                    border: report.hasVoted ? 'none' : '1.5px solid rgba(226,232,240,0.9)',
                    boxShadow: report.hasVoted ? '0 4px 16px rgba(99,102,241,0.3)' : '0 2px 8px rgba(15,23,42,0.06)',
                  }}
                >
                  <motion.div
                    animate={report.hasVoted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ThumbsUp size={16} strokeWidth={2.5} />
                  </motion.div>
                  <motion.span
                    key={report.votes}
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    {report.votes}
                  </motion.span>
                </motion.button>

                {/* Share button */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[13.5px]"
                  style={{
                    background: shared ? 'rgba(16,185,129,0.1)' : '#fff',
                    color: shared ? '#10B981' : '#64748B',
                    border: `1.5px solid ${shared ? 'rgba(16,185,129,0.3)' : 'rgba(226,232,240,0.9)'}`,
                    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                  }}
                >
                  {shared ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <Share2 size={16} strokeWidth={2.5} />}
                  {shared ? 'Ulashildi!' : 'Ulashish'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
