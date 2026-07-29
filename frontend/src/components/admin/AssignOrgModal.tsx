import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { MOCK_ORGANIZATIONS, type MockOrganization } from '@backend/mock/organizations'

interface Props {
  reportCategory: string
  open: boolean
  onClose: () => void
  onAssign: (org: MockOrganization) => void
}

export default function AssignOrgModal({ reportCategory, open, onClose, onAssign }: Props) {
  const [search, setSearch] = useState('')

  const filtered = MOCK_ORGANIZATIONS.filter(org => {
    const q = search.toLowerCase()
    return !q || org.name.toLowerCase().includes(q) || org.category.toLowerCase().includes(q)
  })

  const sorted = [
    ...filtered.filter(org => org.category === reportCategory),
    ...filtered.filter(org => org.category !== reportCategory),
  ]

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(15,23,42,0.5)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl flex flex-col"
            style={{ background: '#fff', maxHeight: '80vh' }}
            role="dialog"
            aria-modal="true"
            aria-label="Tashkilot tanlash"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: '#E2E8F0' }} />
            </div>

            {/* Header */}
            <div className="px-4 pt-2 pb-3 flex items-center justify-between shrink-0"
              style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
              <div>
                <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Tashkilot tanlash</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Arizani yo'naltirish uchun tashkilotni tanlang</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(241,245,249,0.8)' }}>
                <X size={16} style={{ color: '#64748B' }} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tashkilot qidirish..."
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[12.5px] outline-none"
                  style={{ background: '#F8FAFC', border: '1px solid rgba(226,232,240,0.8)', color: '#0F172A' }}
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto px-4 pb-8 flex-1">
              {sorted.length === 0 && (
                <p className="text-center py-10 text-[13px]" style={{ color: '#94A3B8' }}>Tashkilot topilmadi</p>
              )}
              {sorted.map((org) => {
                const isMatch = org.category === reportCategory
                return (
                  <motion.button
                    key={org.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onAssign(org) }}
                    className="w-full flex items-center gap-3 py-3 text-left"
                    style={{ borderBottom: '1px solid rgba(226,232,240,0.5)' }}
                  >
                    <span className="text-xl w-9 text-center shrink-0">{org.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold truncate" style={{ color: '#0F172A' }}>{org.name}</p>
                        {isMatch && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>Mos</span>
                        )}
                      </div>
                      <p className="text-[10.5px]" style={{ color: '#94A3B8' }}>{org.district} · {org.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-black" style={{ color: '#3B82F6' }}>{org.totalAssigned}</p>
                      <p className="text-[9.5px]" style={{ color: '#94A3B8' }}>ariza</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
