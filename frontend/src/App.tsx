import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Feed from './pages/Feed'
import Create from './pages/Create'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import { useAuth } from './hooks/useAuth'
import { useSSE } from './hooks/useSSE'

export type Tab = 'feed' | 'create' | 'profile'

export default function App() {
  const [tab, setTab] = useState<Tab>('feed')
  const [prevTab, setPrevTab] = useState<Tab>('feed')
  const [showAdmin, setShowAdmin] = useState(false)

  const { token, loading: authLoading } = useAuth()
  useSSE(token)

  useEffect(() => {
    const tg = (window as { Telegram?: { WebApp?: { expand?: () => void; ready?: () => void; setBackgroundColor?: (c: string) => void } } }).Telegram?.WebApp
    if (tg) {
      tg.expand?.()
      tg.ready?.()
      tg.setBackgroundColor?.('#F8FAFC')
    }
  }, [])

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#F8FAFC' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const handleTabChange = (next: Tab) => {
    setPrevTab(tab)
    setTab(next)
  }

  const getDirection = (current: Tab, previous: Tab): number => {
    const order: Tab[] = ['feed', 'create', 'profile']
    return order.indexOf(current) > order.indexOf(previous) ? 1 : -1
  }

  const dir = getDirection(tab, prevTab)

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100dvh', background: '#F8FAFC' }}>

      {/* Admin overlay */}
      <AnimatePresence>
        {showAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 z-50 flex flex-col overflow-hidden"
            style={{ background: '#F8FAFC' }}
          >
            <Admin onBack={() => setShowAdmin(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={tab}
            custom={dir}
            initial={{ opacity: 0, x: dir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -28 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex flex-col overflow-hidden"
          >
            {tab === 'feed'    && <Feed />}
            {tab === 'create'  && <Create onSuccess={() => handleTabChange('profile')} />}
            {tab === 'profile' && <Profile onOpenAdmin={() => setShowAdmin(true)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  )
}
