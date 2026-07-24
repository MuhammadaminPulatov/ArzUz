import { Bell } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeaderProps {
  onOpenTickets: () => void
  ticketCount: number
}

export default function Header({ onOpenTickets, ticketCount }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-center justify-between px-4 pt-4 pb-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          A
        </div>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--tg-theme-text-color, #0F172A)' }}>
            Salom, Aziz 👋
          </h1>
          <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--tg-theme-hint-color, #64748B)' }}>
            Mahalla infratuzilmasini birga yaxshilaymiz
          </p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onOpenTickets}
        className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors"
        style={{
          background: 'var(--tg-theme-secondary-bg-color, #EFF6FF)',
          color: '#3B82F6',
          minHeight: '44px',
        }}
      >
        <Bell size={14} strokeWidth={2.5} />
        <span>Murojaatlarim</span>
        {ticketCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center"
          >
            {ticketCount}
          </motion.span>
        )}
      </motion.button>
    </motion.header>
  )
}
