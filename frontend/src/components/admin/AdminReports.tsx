import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, FileText, ThumbsUp, Building2 } from 'lucide-react'
import { CATEGORIES } from '../../data/mock'
import type { Report } from '../../types'
import AssignOrgModal from './AssignOrgModal'
import { type MockOrganization } from '@backend/mock/organizations'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  new:         { label: 'Yangi',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  sent:        { label: 'Kutilmoqda', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  in_progress: { label: 'Jarayonda',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  dot: '#3B82F6' },
  resolved:    { label: 'Hal etildi', color: '#10B981', bg: 'rgba(16,185,129,0.1)',  dot: '#10B981' },
}

const ITEMS_PER_PAGE = 20

interface Props {
  reports: Report[]
  onStatusChange: (id: string, status: Report['status']) => void
  updatingId: string | null
}

export default function AdminReports({ reports, onStatusChange, updatingId }: Props) {
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage]                     = useState(1)
  const [assignedOrgs,    setAssignedOrgs]   = useState<Record<string, MockOrganization>>({})
  const [assigningReport, setAssigningReport] = useState<{ id: string; category: string } | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return reports.filter(r => {
      const matchSearch   = !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
      const matchStatus   = statusFilter   === 'all' || r.status   === statusFilter
      const matchCategory = categoryFilter === 'all' || r.category === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [reports, search, statusFilter, categoryFilter])

  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore   = paginated.length < filtered.length

  const handleAssign = (org: MockOrganization) => {
    if (!assigningReport) return
    setAssignedOrgs(prev => ({ ...prev, [assigningReport.id]: org }))
    onStatusChange(assigningReport.id, 'in_progress')
    setAssigningReport(null)
  }

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-3">

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[140px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Qidirish..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[12.5px] outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#0F172A', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
          />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-[12px] font-semibold outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#475569', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
            <option value="all">Holat</option>
            <option value="new">Yangi</option>
            <option value="sent">Kutilmoqda</option>
            <option value="in_progress">Jarayonda</option>
            <option value="resolved">Hal etildi</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>
        <div className="relative">
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-[12px] font-semibold outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#475569', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
            <option value="all">Kategoriya</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.label}>{c.icon} {c.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>
      </div>

      <p className="text-[11px]" style={{ color: '#94A3B8' }}>{filtered.length} ta ariza topildi</p>

      <div className="md:grid md:grid-cols-2 md:gap-3 flex flex-col gap-3">
        {paginated.map((r, i) => {
          const st = STATUS_MAP[r.status] ?? STATUS_MAP['new']!
          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-2xl p-4"
              style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: r.photoColor }}>{r.photoEmoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[10px] font-bold" style={{ color: '#3B82F6' }}>{r.id}</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold leading-snug" style={{ color: '#0F172A' }}>{r.title}</p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: '#94A3B8' }}>{r.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3 text-[10.5px]" style={{ color: '#94A3B8' }}>
                <span>{r.username}</span><span>·</span>
                <span>{r.createdAt}</span><span>·</span>
                <ThumbsUp size={10} strokeWidth={2} /><span>{r.votes}</span>
              </div>

              <div className="flex gap-2 mb-2">
                {(['sent', 'in_progress', 'resolved'] as const).map(s => {
                  const cfg = STATUS_MAP[s]!
                  const isActive = r.status === s
                  return (
                    <motion.button key={s} whileTap={{ scale: 0.92 }}
                      disabled={isActive || updatingId === r.id}
                      onClick={() => onStatusChange(r.id, s)}
                      className="flex-1 py-2 rounded-xl text-[10.5px] font-bold transition-all"
                      style={{
                        background: isActive ? cfg.bg : 'rgba(241,245,249,0.8)',
                        color: isActive ? cfg.color : '#94A3B8',
                        border: isActive ? `1.5px solid ${cfg.color}40` : '1.5px solid transparent',
                        opacity: updatingId === r.id && !isActive ? 0.5 : 1,
                      }}>
                      {updatingId === r.id && !isActive ? '...' : cfg.label}
                    </motion.button>
                  )
                })}
              </div>

              {assignedOrgs[r.id] ? (
                <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <span className="text-base leading-none">{assignedOrgs[r.id]!.icon}</span>
                  <span>{assignedOrgs[r.id]!.shortName}</span>
                  <span style={{ color: '#94A3B8' }}>ga yo'naltirildi</span>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setAssigningReport({ id: r.id, category: r.category })}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: 'rgba(241,245,249,0.8)', color: '#64748B', border: '1px dashed #CBD5E1' }}>
                  <Building2 size={12} />
                  Tashkilotga yo'naltirish
                </motion.button>
              )}
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
          <p className="text-[14px] font-bold" style={{ color: '#94A3B8' }}>Ariza topilmadi</p>
        </div>
      )}

      {hasMore && (
        <button onClick={() => setPage(p => p + 1)}
          className="py-3 rounded-2xl text-[13px] font-bold w-full mt-1"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#3B82F6', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          Ko'proq yuklash ({filtered.length - paginated.length} ta qoldi)
        </button>
      )}

      <AssignOrgModal
        reportCategory={assigningReport?.category ?? ''}
        open={assigningReport !== null}
        onClose={() => setAssigningReport(null)}
        onAssign={handleAssign}
      />
    </div>
  )
}
