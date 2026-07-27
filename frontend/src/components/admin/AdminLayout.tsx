// frontend/src/components/admin/AdminLayout.tsx
import { motion } from 'framer-motion'
import {
  ArrowLeft, RefreshCw, Activity, FileText,
  Building2, Users, BarChart3, Map, Shield,
} from 'lucide-react'

export type AdminSection = 'dashboard' | 'reports' | 'organizations' | 'users' | 'analytics' | 'map'

interface AdminLayoutProps {
  activeSection: AdminSection
  onSectionChange: (s: AdminSection) => void
  onBack: () => void
  onRefresh: () => void
  loading: boolean
  children: React.ReactNode
}

const NAV: { id: AdminSection; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard',     label: 'Dashboard',       Icon: Activity   },
  { id: 'reports',       label: 'Arizalar',         Icon: FileText   },
  { id: 'organizations', label: 'Tashkilotlar',     Icon: Building2  },
  { id: 'users',         label: 'Foydalanuvchilar', Icon: Users      },
  { id: 'analytics',     label: 'Analytics',        Icon: BarChart3  },
  { id: 'map',           label: 'Xarita',           Icon: Map        },
]

export default function AdminLayout({
  activeSection, onSectionChange, onBack, onRefresh, children,
}: AdminLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F8FAFC' }}>

      {/* ── Desktop Sidebar (md+) ── */}
      <div
        className="hidden md:flex flex-col shrink-0 h-full"
        style={{
          width: 220,
          background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
          boxShadow: '4px 0 24px rgba(15,23,42,0.3)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} style={{ color: '#60A5FA' }} />
            <span className="text-[16px] font-black text-white">Admin Panel</span>
          </div>
          <p className="text-[10px]" style={{ color: '#475569' }}>Mahalla Muammolari</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ id, label, Icon }) => {
            const isActive = activeSection === id
            return (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors text-left w-full"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#fff' : '#64748B',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-6 shrink-0 flex flex-col gap-0.5">
          <button
            onClick={onRefresh}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full"
            style={{ color: '#64748B' }}
          >
            <RefreshCw size={16} />
            Yangilash
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full"
            style={{ color: '#64748B' }}
          >
            <ArrowLeft size={16} />
            Orqaga
          </button>
        </div>
      </div>

      {/* ── Mobile + Content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile Header */}
        <div
          className="md:hidden px-4 pt-4 pb-4 shrink-0 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            boxShadow: '0 4px 24px rgba(15,23,42,0.3)',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft size={18} className="text-white" strokeWidth={2} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: '#60A5FA' }} strokeWidth={2} />
              <h1 className="text-[17px] font-black text-white">Admin Panel</h1>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
              Mahalla Muammolari · Boshqaruv tizimi
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88, rotate: 180 }}
            onClick={onRefresh}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <RefreshCw size={15} className="text-white" strokeWidth={2} />
          </motion.button>
        </div>

        {/* Mobile Tab Bar */}
        <div
          className="md:hidden flex overflow-x-auto px-3 pt-3 pb-2 gap-2 shrink-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {NAV.map(({ id, label, Icon }) => {
            const isActive = activeSection === id
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.93 }}
                onClick={() => onSectionChange(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-bold whitespace-nowrap shrink-0 transition-all"
                style={{
                  background: isActive ? '#0F172A' : 'rgba(255,255,255,0.8)',
                  color: isActive ? '#fff' : '#64748B',
                  boxShadow: isActive
                    ? '0 4px 14px rgba(15,23,42,0.25)'
                    : '0 1px 4px rgba(15,23,42,0.06)',
                  border: isActive ? 'none' : '1px solid rgba(226,232,240,0.8)',
                }}
              >
                <Icon size={13} />
                {label}
              </motion.button>
            )
          })}
        </div>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
