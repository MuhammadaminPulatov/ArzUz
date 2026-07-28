import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Phone, MapPin } from 'lucide-react'
import { MOCK_ORGANIZATIONS } from '@backend/mock/organizations'

export default function AdminOrganizations() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-3">
      <div>
        <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Tashkilotlar</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
          Mas'ul idoralar va mahalla qo'mitalari
        </p>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-3 flex flex-col gap-3">
        {MOCK_ORGANIZATIONS.map(org => {
          const isOpen = expanded === org.id
          const resolvedPct = org.totalAssigned > 0
            ? Math.round((org.resolved / org.totalAssigned) * 100)
            : 0

          return (
            <div key={org.id} className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>

              <button onClick={() => setExpanded(isOpen ? null : org.id)}
                className="w-full flex items-center gap-3 p-4 text-left">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(59,130,246,0.08)' }}>
                  {org.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate" style={{ color: '#0F172A' }}>{org.name}</p>
                  <p className="text-[11px]" style={{ color: '#94A3B8' }}>{org.category}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>{org.totalAssigned}</p>
                    <p className="text-[10px]" style={{ color: '#94A3B8' }}>ariza</p>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} style={{ color: '#94A3B8' }} />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}>
                    <div className="px-4 pb-4 flex flex-col gap-3"
                      style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}>

                      <div className="flex flex-col gap-1.5 pt-3">
                        <div className="flex items-center gap-2 text-[12px]" style={{ color: '#64748B' }}>
                          <Phone size={13} /><span>{org.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]" style={{ color: '#64748B' }}>
                          <MapPin size={13} /><span>{org.district}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px]" style={{ color: '#64748B' }}>Hal etilish darajasi</span>
                          <span className="text-[11px] font-bold" style={{ color: '#10B981' }}>{resolvedPct}%</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <div className="h-2 rounded-full"
                            style={{ width: `${resolvedPct}%`, background: '#10B981', transition: 'width 0.5s ease' }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Jami',       value: org.totalAssigned, color: '#3B82F6' },
                          { label: 'Jarayonda',  value: org.inProgress,    color: '#F59E0B' },
                          { label: 'Hal etildi', value: org.resolved,      color: '#10B981' },
                        ].map(s => (
                          <div key={s.label} className="rounded-xl p-2.5 text-center"
                            style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.6)' }}>
                            <p className="text-[16px] font-black" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px]" style={{ color: '#94A3B8' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
