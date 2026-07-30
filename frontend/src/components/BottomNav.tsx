import { motion } from 'framer-motion'
import { Home, Plus, User } from 'lucide-react'
import { haptic } from '../hooks/useTelegramUI'

type Tab = 'feed' | 'create' | 'profile'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'feed',    icon: Home, label: 'Asosiy' },
  { id: 'create',  icon: Plus, label: 'Ariza'  },
  { id: 'profile', icon: User, label: 'Profil' },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const handleChange = (tab: Tab) => {
    haptic(tab === 'create' ? 'tap' : 'select')
    onChange(tab)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around"
      style={{
        background: 'rgba(250,250,252,0.92)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '0.5px solid rgba(0,0,0,0.1)',
        paddingBottom: `max(env(safe-area-inset-bottom, 0px), 12px)`,
        paddingTop: 8,
        boxShadow: '0 -0.5px 0 rgba(0,0,0,0.08)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id
        const isCreate = tab.id === 'create'

        if (isCreate) {
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleChange(tab.id)}
              className="flex flex-col items-center gap-1 pb-1"
              style={{ minWidth: 72 }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.08 : 1,
                  rotate: isActive ? 45 : 0,
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="w-[52px] h-[52px] rounded-[18px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #3B82F6 0%, #6366F1 100%)',
                  boxShadow: isActive
                    ? '0 6px 20px rgba(59,130,246,0.45), 0 2px 6px rgba(99,102,241,0.3)'
                    : '0 4px 14px rgba(59,130,246,0.35)',
                }}
              >
                <Plus size={24} className="text-white" strokeWidth={2.5} />
              </motion.div>
              <span className="text-[10px] font-semibold" style={{ color: isActive ? '#3B82F6' : '#8E8E93' }}>
                {tab.label}
              </span>
            </motion.button>
          )
        }

        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleChange(tab.id)}
            className="flex flex-col items-center gap-1 pb-1"
            style={{ minWidth: 72 }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 44, height: 36 }}>
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-[13px]"
                  style={{ background: 'rgba(59,130,246,0.1)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <motion.div
                animate={{ y: isActive ? -1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? '#3B82F6' : '#8E8E93', transition: 'color 0.18s' }}
                />
              </motion.div>
            </div>
            <motion.span
              animate={{ color: isActive ? '#3B82F6' : '#8E8E93' }}
              transition={{ duration: 0.18 }}
              className="text-[10px] font-semibold leading-none"
            >
              {tab.label}
            </motion.span>
          </motion.button>
        )
      })}
    </nav>
  )
}
