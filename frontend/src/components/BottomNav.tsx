import { motion } from 'framer-motion'
import { Home, PlusCircle, User } from 'lucide-react'

type Tab = 'feed' | 'create' | 'profile'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS = [
  { id: 'feed' as Tab, icon: Home, label: 'Asosiy' },
  { id: 'create' as Tab, icon: PlusCircle, label: 'Ariza' },
  { id: 'profile' as Tab, icon: User, label: 'Profil' },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 pb-safe"
      style={{
        background: 'var(--tg-theme-bg-color, #ffffff)',
        borderTop: '1px solid rgba(148,163,184,0.15)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        paddingTop: '8px',
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id
        const isCreate = tab.id === 'create'
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.88 }}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-0.5 relative"
            style={{ minWidth: 64, minHeight: 48 }}
          >
            {isCreate ? (
              <motion.div
                animate={{ scale: isActive ? 1.08 : 1 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
              >
                <tab.icon size={22} className="text-white" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <>
                <motion.div
                  animate={{ y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <tab.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#3B82F6' : 'var(--tg-theme-hint-color, #94A3B8)' }}
                  />
                </motion.div>
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: isActive ? '#3B82F6' : 'var(--tg-theme-hint-color, #94A3B8)' }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-blue-500"
                  />
                )}
              </>
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}
