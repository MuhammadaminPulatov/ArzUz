import { motion } from 'framer-motion'
import { Home, Plus, User } from 'lucide-react'

type Tab = 'feed' | 'create' | 'profile'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'feed', icon: Home, label: 'Asosiy' },
  { id: 'create', icon: Plus, label: 'Ariza' },
  { id: 'profile', icon: User, label: 'Profil' },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-4"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(148,163,184,0.15)',
        paddingBottom: `max(env(safe-area-inset-bottom, 0px), 14px)`,
        paddingTop: '10px',
        boxShadow: '0 -4px 24px rgba(15,23,42,0.06)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id
        const isCreate = tab.id === 'create'

        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.85 }}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center justify-center relative"
            style={{ minWidth: 64, minHeight: 52 }}
          >
            {isCreate ? (
              <motion.div
                animate={{ scale: isActive ? 1.06 : 1, rotate: isActive ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.4), 0 2px 8px rgba(59,130,246,0.3)',
                }}
              >
                <Plus size={26} className="text-white" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <>
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-xl -m-1.5"
                      style={{ background: 'rgba(59,130,246,0.1)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={{ y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="p-1.5"
                  >
                    <tab.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      style={{
                        color: isActive ? '#3B82F6' : '#94A3B8',
                        transition: 'color 0.2s',
                      }}
                    />
                  </motion.div>
                </div>
                <motion.span
                  animate={{ color: isActive ? '#3B82F6' : '#94A3B8' }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] font-semibold leading-none mt-0.5"
                >
                  {tab.label}
                </motion.span>
              </>
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}
