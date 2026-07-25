import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Clock, MessageCircle, BellOff } from 'lucide-react'
interface Notification { id: string; reportTitle: string; message: string; type: 'resolved' | 'in_progress' | 'comment'; read: boolean; createdAt: string }
const markAllRead = () => {}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Hozir"
  if (mins < 60) return `${mins} daqiqa oldin`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} soat oldin`
  return `${Math.floor(hrs / 24)} kun oldin`
}

const TYPE_CONFIG = {
  resolved:    { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Hal etildi' },
  in_progress: { icon: Clock,        color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  label: 'Jarayonda' },
  comment:     { icon: MessageCircle,color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Izoh' },
}

interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
  notifications: Notification[]
}

export default function NotificationDrawer({ open, onClose, notifications }: NotificationDrawerProps) {
  const handleOpen = () => {
    markAllRead()
  }

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onAnimationComplete={(def) => {
              if (def === 'animate') handleOpen()
            }}
            className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '75vh',
              background: '#fff',
              boxShadow: '0 -8px 40px rgba(15,23,42,0.18)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(148,163,184,0.4)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h2 className="text-[16px] font-black" style={{ color: '#0F172A' }}>Bildirishnomalar</h2>
                {notifications.length > 0 && (
                  <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                    {notifications.length} ta xabar
                  </p>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(241,245,249,0.9)' }}
              >
                <X size={17} strokeWidth={2.5} style={{ color: '#64748B' }} />
              </motion.button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ scrollbarWidth: 'none' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <BellOff size={44} strokeWidth={1.5} style={{ color: '#CBD5E1' }} className="mb-3" />
                  <p className="text-[14px] font-bold" style={{ color: '#94A3B8' }}>Bildirishnoma yo'q</p>
                  <p className="text-[12px] mt-1" style={{ color: '#CBD5E1' }}>
                    Arizalaringiz yangilanganda bu yerda ko'rinadi
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {notifications.map((n, i) => {
                    const cfg = TYPE_CONFIG[n.type]
                    const Icon = cfg.icon
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-3 p-3.5 rounded-2xl relative"
                        style={{
                          background: n.read ? '#F8FAFC' : 'rgba(59,130,246,0.04)',
                          border: `1px solid ${n.read ? 'rgba(226,232,240,0.6)' : 'rgba(59,130,246,0.15)'}`,
                        }}
                      >
                        {!n.read && (
                          <span
                            className="absolute top-3 right-3 w-2 h-2 rounded-full"
                            style={{ background: '#3B82F6' }}
                          />
                        )}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: cfg.bg }}
                        >
                          <Icon size={18} strokeWidth={2} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-[12.5px] font-semibold leading-snug" style={{ color: '#0F172A' }}>
                            {n.message}
                          </p>
                          <p className="text-[10.5px] mt-1" style={{ color: '#94A3B8' }}>
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
