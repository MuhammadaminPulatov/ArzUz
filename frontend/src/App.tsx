import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Feed from './pages/Feed'
import Create from './pages/Create'
import Profile from './pages/Profile'

type Tab = 'feed' | 'create' | 'profile'

export default function App() {
  const [tab, setTab] = useState<Tab>('feed')
  const [prevTab, setPrevTab] = useState<Tab>('feed')

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.expand()
      tg.ready()
      tg.setBackgroundColor('#F8FAFC')
    }
  }, [])

  const handleTabChange = (next: Tab) => {
    setPrevTab(tab)
    setTab(next)
  }

  const getDirection = (current: Tab, previous: Tab): number => {
    const order: Tab[] = ['feed', 'create', 'profile']
    const ci = order.indexOf(current)
    const pi = order.indexOf(previous)
    return ci > pi ? 1 : -1
  }

  const dir = getDirection(tab, prevTab)

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: '100dvh',
        background: 'var(--tg-theme-bg-color, #F8FAFC)',
      }}
    >
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
            {tab === 'feed' && <Feed />}
            {tab === 'create' && <Create onSuccess={() => handleTabChange('profile')} />}
            {tab === 'profile' && <Profile />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  )
}
