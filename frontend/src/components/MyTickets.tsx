import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Clock, ChevronRight } from 'lucide-react'

export interface Ticket {
  id: string
  category: string
  categoryIcon: string
  description: string
  address: string
  date: string
  status: 'sent' | 'in_progress' | 'resolved'
  thumbnailColor: string
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  new:         { label: "Yangi",      dot: "#F59E0B", bg: "rgba(245,158,11,0.12)", text: "#B45309" },
  sent:        { label: "Yuborildi", dot: "#F59E0B", bg: "rgba(245,158,11,0.12)", text: "#B45309" },
  in_progress: { label: "Jarayonda", dot: "#3B82F6", bg: "rgba(59,130,246,0.12)", text: "#1D4ED8" },
  resolved:    { label: "Hal Etildi", dot: "#10B981", bg: "rgba(16,185,129,0.12)", text: "#065F46" },
}

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'ARZ-1004',
    category: "Yo'l nosozligi",
    categoryIcon: '🚧',
    description: "Chorsu ko'chasida katta chuqur paydo bo'lgan, xavfli holat",
    address: 'Toshkent sh., Chorsu bozori atrofi',
    date: 'Bugun, 14:30',
    status: 'in_progress',
    thumbnailColor: '#DBEAFE',
  },
  {
    id: 'ARZ-1003',
    category: "Chiroq nosozligi",
    categoryIcon: '💡',
    description: "Ko'cha chiroqlari ishlamayapti, tungi xavfsizlik muammosi",
    address: "Mirzo Ulug'bek, 3-mavze",
    date: 'Kecha, 09:15',
    status: 'sent',
    thumbnailColor: '#FEF3C7',
  },
  {
    id: 'ARZ-1002',
    category: "Axlat muammosi",
    categoryIcon: '🗑️',
    description: "Axlat qutilar to'lib ketgan, uzoq vaqtdan beri olinmagan",
    address: "Yunusobod, 7-mavze",
    date: '22 Iyul, 11:00',
    status: 'resolved',
    thumbnailColor: '#D1FAE5',
  },
  {
    id: 'ARZ-1001',
    category: "Suv muammosi",
    categoryIcon: '💧',
    description: "Ko'chada suv quvuri yorilgan, ko'cha suv ostida",
    address: 'Uchtepa, Bog\'ishamol ko\'ch.',
    date: '20 Iyul, 16:45',
    status: 'resolved',
    thumbnailColor: '#E0F2FE',
  },
]

interface MyTicketsProps {
  isOpen: boolean
  onClose: () => void
}

export default function MyTickets({ isOpen, onClose }: MyTicketsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--tg-theme-bg-color, #F8FAFC)',
              maxHeight: '88vh',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-slate-300 opacity-60" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-1 pb-3">
              <div>
                <h2 className="text-[17px] font-bold" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
                  Mening murojaatlarim
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--tg-theme-hint-color, #64748B)' }}>
                  {SAMPLE_TICKETS.length} ta murojaat
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--tg-theme-secondary-bg-color, #E2E8F0)' }}
              >
                <X size={15} strokeWidth={2.5} style={{ color: 'var(--tg-theme-hint-color, #64748B)' }} />
              </motion.button>
            </div>

            {/* Stats row */}
            <div className="flex gap-2 px-4 pb-3">
              {[
                { label: "Yuborildi", count: 1, color: STATUS_CONFIG.sent.text, bg: STATUS_CONFIG.sent.bg },
                { label: "Jarayonda", count: 1, color: STATUS_CONFIG.in_progress.text, bg: STATUS_CONFIG.in_progress.bg },
                { label: "Hal Etildi", count: 2, color: STATUS_CONFIG.resolved.text, bg: STATUS_CONFIG.resolved.bg },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 rounded-xl px-2 py-2 text-center"
                  style={{ background: stat.bg }}
                >
                  <div className="text-[18px] font-bold" style={{ color: stat.color }}>{stat.count}</div>
                  <div className="text-[10px] font-medium" style={{ color: stat.color }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Ticket list */}
            <div className="overflow-y-auto flex-1 px-4 pb-6 flex flex-col gap-3">
              {SAMPLE_TICKETS.map((ticket, i) => {
                const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG['new']
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.28 }}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{
                      background: 'var(--tg-theme-secondary-bg-color, #ffffff)',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                      style={{ background: ticket.thumbnailColor }}
                    >
                      {ticket.categoryIcon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[11px] font-semibold text-blue-500">{ticket.id}</span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: status.bg, color: status.text }}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p
                        className="text-[13px] font-medium leading-tight truncate"
                        style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}
                      >
                        {ticket.categoryIcon} {ticket.category}
                      </p>

                      <p
                        className="text-[11px] leading-tight mt-0.5 line-clamp-1"
                        style={{ color: 'var(--tg-theme-hint-color, #64748B)' }}
                      >
                        {ticket.description}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5">
                        <span
                          className="flex items-center gap-1 text-[10px]"
                          style={{ color: 'var(--tg-theme-hint-color, #94A3B8)' }}
                        >
                          <MapPin size={9} strokeWidth={2.5} />
                          <span className="truncate max-w-[100px]">{ticket.address}</span>
                        </span>
                        <span
                          className="flex items-center gap-1 text-[10px] shrink-0"
                          style={{ color: 'var(--tg-theme-hint-color, #94A3B8)' }}
                        >
                          <Clock size={9} strokeWidth={2.5} />
                          {ticket.date}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--tg-theme-hint-color, #CBD5E1)' }} className="shrink-0" />
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
