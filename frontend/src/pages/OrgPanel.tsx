import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, LogOut, CheckCircle2, Clock,
  FileText, ChevronRight, ThumbsUp, MapPin,
} from 'lucide-react'
import { useOrgAuth, type OrgInfo } from '../hooks/useOrgAuth'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

async function orgFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/org${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  })
  const json = await res.json() as { ok: boolean; data?: T; error?: string }
  if (!json.ok) throw new Error(json.error ?? 'Xato')
  return json.data as T
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  new:         { label: 'Yangi',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  sent:        { label: 'Kutilmoqda', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  in_progress: { label: 'Jarayonda',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  dot: '#3B82F6' },
  resolved:    { label: 'Hal etildi', color: '#10B981', bg: 'rgba(16,185,129,0.1)',  dot: '#10B981' },
}

interface RawTicket {
  id?: string
  _id?: string
  aiTitle?: string
  title?: string
  address?: string
  category?: string
  status?: string
  votes?: number
  createdAt?: string
  severity?: string
}

interface OrgStats {
  total: number
  inProgress: number
  resolved: number
  pending: number
}

// ─── Login form ──────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (token: string, org: OrgInfo) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/org/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json() as { ok: boolean; data?: { token: string; org: OrgInfo }; error?: string }
      if (!json.ok || !json.data) throw new Error(json.error ?? 'Kirish xatosi')
      onLogin(json.data.token, json.data.org)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kirish xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6" style={{ background: '#F0F4FF' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
            <Building2 size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-[22px] font-black" style={{ color: '#0F172A' }}>Tashkilot paneli</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748B' }}>Mas'ul idoralar uchun kirish</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-bold mb-1.5 block" style={{ color: '#475569' }}>Login</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="kommunal"
              required
              className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
              style={{ background: '#fff', border: '1.5px solid rgba(226,232,240,0.9)', color: '#0F172A', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
            />
          </div>
          <div>
            <label className="text-[12px] font-bold mb-1.5 block" style={{ color: '#475569' }}>Parol</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
              style={{ background: '#fff', border: '1.5px solid rgba(226,232,240,0.9)', color: '#0F172A', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
            />
          </div>

          {error && (
            <p className="text-[12px] px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="py-3.5 rounded-2xl text-[14px] font-bold text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────
interface Props { onBack: () => void }

export default function OrgPanel({ onBack }: Props) {
  const { token, org, loading: authLoading, login, logout } = useOrgAuth()
  const [tickets,      setTickets]      = useState<RawTicket[]>([])
  const [stats,        setStats]        = useState<OrgStats | null>(null)
  const [dataLoading,  setDataLoading]  = useState(false)
  const [updatingId,   setUpdatingId]   = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = useCallback(async () => {
    if (!token) return
    setDataLoading(true)
    try {
      const [t, s] = await Promise.all([
        orgFetch<{ tickets: RawTicket[]; total: number }>(`/tickets?status=${statusFilter}`, token),
        orgFetch<OrgStats>('/stats', token),
      ])
      setTickets(t.tickets)
      setStats(s)
    } catch { /* silent */ } finally {
      setDataLoading(false)
    }
  }, [token, statusFilter])

  useEffect(() => { loadData() }, [loadData])

  const handleStatusChange = async (id: string, status: 'in_progress' | 'resolved') => {
    if (!token) return
    setUpdatingId(id)
    try {
      await orgFetch(`/tickets/${id}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setTickets(prev => prev.map(t => (t.id ?? t._id) === id ? { ...t, status } : t))
      await loadData()
    } catch { /* silent */ } finally {
      setUpdatingId(null)
    }
  }

  if (authLoading) return null

  if (!token || !org) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: '#fff', borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(241,245,249,0.9)' }}>
            <ChevronRight size={17} style={{ color: '#0F172A', transform: 'rotate(180deg)' }} />
          </motion.button>
          <span className="text-[15px] font-black" style={{ color: '#0F172A' }}>Tashkilot paneli</span>
        </div>
        <div className="flex-1">
          <LoginForm onLogin={login} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F0F4FF' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0"
        style={{ background: 'linear-gradient(150deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ChevronRight size={16} className="text-white" style={{ transform: 'rotate(180deg)' }} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <LogOut size={13} className="text-white" />
            <span className="text-[11px] font-bold text-white">Chiqish</span>
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            {org.icon}
          </div>
          <div>
            <h1 className="text-[17px] font-black text-white leading-tight">{org.name}</h1>
            <p className="text-[11px] text-blue-200 mt-0.5">{org.category} · {org.district}</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: 'Jami',      value: stats.total,      color: '#93C5FD' },
              { label: 'Kutmoqda', value: stats.pending,    color: '#FCD34D' },
              { label: 'Jarayonda', value: stats.inProgress, color: '#60A5FA' },
              { label: 'Hal etildi', value: stats.resolved, color: '#34D399' },
            ].map(s => (
              <div key={s.label} className="text-center rounded-xl p-2"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                <p className="text-[18px] font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-blue-200">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="px-4 py-2.5 shrink-0 flex gap-2 overflow-x-auto"
        style={{ background: '#fff', borderBottom: '1px solid rgba(226,232,240,0.6)', scrollbarWidth: 'none' }}>
        {[
          { id: 'all',         label: 'Barchasi' },
          { id: 'in_progress', label: 'Jarayonda' },
          { id: 'resolved',    label: 'Hal etildi' },
        ].map(f => (
          <motion.button key={f.id} whileTap={{ scale: 0.93 }}
            onClick={() => setStatusFilter(f.id)}
            className="px-4 py-2 rounded-xl text-[11.5px] font-bold shrink-0"
            style={{
              background: statusFilter === f.id ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : 'rgba(241,245,249,0.9)',
              color: statusFilter === f.id ? '#fff' : '#64748B',
              boxShadow: statusFilter === f.id ? '0 3px 10px rgba(99,102,241,0.25)' : 'none',
            }}>
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Tickets */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-3 flex flex-col gap-3">
        {dataLoading ? (
          <div className="flex justify-center py-16">
            <div style={{ width: 28, height: 28, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={44} className="mb-4" style={{ color: '#CBD5E1' }} strokeWidth={1.5} />
            <p className="text-[15px] font-bold" style={{ color: '#0F172A' }}>Ariza yo'q</p>
            <p className="text-[12.5px] mt-1.5" style={{ color: '#94A3B8' }}>
              {statusFilter === 'all' ? "Sizga hali ariza tayinlanmagan" : "Bu filtrdagi ariza yo'q"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {tickets.map((t, i) => {
              const id = t.id ?? t._id ?? ''
              const st = STATUS_MAP[t.status ?? 'new'] ?? STATUS_MAP['new']!
              return (
                <motion.div key={id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-4"
                  style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold" style={{ color: '#3B82F6' }}>{t.category}</span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-semibold" style={{ color: '#0F172A' }}>
                        {t.aiTitle ?? t.title ?? 'Ariza'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: '#94A3B8' }}>
                      <ThumbsUp size={11} strokeWidth={2} />
                      <span>{t.votes ?? 0}</span>
                    </div>
                  </div>

                  {t.address && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <MapPin size={11} style={{ color: '#94A3B8' }} strokeWidth={2} />
                      <span className="text-[11px] truncate" style={{ color: '#94A3B8' }}>{t.address}</span>
                    </div>
                  )}

                  {t.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {t.status !== 'in_progress' && (
                        <motion.button whileTap={{ scale: 0.93 }}
                          disabled={updatingId === id}
                          onClick={() => handleStatusChange(id, 'in_progress')}
                          className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                          <Clock size={12} strokeWidth={2.5} />
                          {updatingId === id ? '...' : 'Jarayonga olish'}
                        </motion.button>
                      )}
                      <motion.button whileTap={{ scale: 0.93 }}
                        disabled={updatingId === id}
                        onClick={() => handleStatusChange(id, 'resolved')}
                        className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        {updatingId === id ? '...' : 'Hal etildi'}
                      </motion.button>
                    </div>
                  )}

                  {t.status === 'resolved' && (
                    <div className="flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
                      style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981' }}>
                      <CheckCircle2 size={12} strokeWidth={2.5} />
                      Muammo hal etildi
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
