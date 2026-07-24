import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  ArrowLeft, TrendingUp, TrendingDown, FileText, CheckCircle2,
  Clock, Users, ThumbsUp, RefreshCw, Search, ChevronDown,
  Shield, Activity, AlertCircle,
} from 'lucide-react'
import { getAnalytics, getAdminReports, updateReportStatus } from '@backend/services/analytics.service'
import type { Analytics } from '@backend/types'
import type { Report } from '../types'

type AdminTab = 'dashboard' | 'reports'

const STATUS_MAP = {
  sent:        { label: 'Kutilmoqda', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', dot: '#F59E0B' },
  in_progress: { label: 'Jarayonda',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', dot: '#3B82F6' },
  resolved:    { label: 'Hal etildi', color: '#10B981', bg: 'rgba(16,185,129,0.1)', dot: '#10B981' },
}

const STATUS_COLORS = ['#10B981', '#3B82F6', '#F59E0B']

interface KpiProps { icon: React.ReactNode; label: string; value: string | number; sub: string; trend?: number; color: string; bg: string }
function KpiCard({ icon, label, value, sub, trend, color, bg }: KpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
      style={{ background: '#fff', boxShadow: '0 2px 16px rgba(15,23,42,0.07)', border: '1px solid rgba(226,232,240,0.8)' }}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: trend >= 0 ? '#10B981' : '#EF4444' }}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-[22px] font-black" style={{ color: '#0F172A' }}>{value}</div>
        <div className="text-[11px] font-medium mt-0.5" style={{ color: '#64748B' }}>{label}</div>
      </div>
      <div className="text-[10px]" style={{ color: '#94A3B8' }}>{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl" style={{ background: color }} />
    </motion.div>
  )
}

interface AdminProps { onBack: () => void }

export default function Admin({ onBack }: AdminProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAnalytics(), getAdminReports()]).then(([aRes, rRes]) => {
      if (aRes.ok) setAnalytics(aRes.data)
      if (rRes.ok) setReports(rRes.data)
      setLoading(false)
    })
  }, [])

  const handleStatusChange = async (id: string, status: Report['status']) => {
    setUpdatingId(id)
    await updateReportStatus(id, status)
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    setUpdatingId(null)
  }

  const filteredReports = reports.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const pieData = analytics
    ? [
        { name: 'Hal etildi', value: analytics.resolvedCount },
        { name: 'Jarayonda', value: analytics.inProgressCount },
        { name: 'Kutilmoqda', value: analytics.pendingCount },
      ]
    : []

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F8FAFC' }}>

      {/* Header */}
      <div
        className="px-4 pt-4 pb-4 shrink-0 flex items-center gap-3"
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

        <div className="flex-1">
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
          onClick={() => {
            setLoading(true)
            Promise.all([getAnalytics(), getAdminReports()]).then(([a, r]) => {
              if (a.ok) setAnalytics(a.data)
              if (r.ok) setReports(r.data)
              setLoading(false)
            })
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <RefreshCw size={15} className="text-white" strokeWidth={2} />
        </motion.button>
      </div>

      {/* Tab bar */}
      <div className="flex px-4 pt-3 pb-2 gap-2 shrink-0">
        {([
          { id: 'dashboard', label: 'Dashboard', icon: <Activity size={14} /> },
          { id: 'reports',   label: 'Arizalar',  icon: <FileText size={14} /> },
        ] as const).map((t) => {
          const isActive = activeTab === t.id
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-bold transition-all"
              style={{
                background: isActive ? '#0F172A' : 'rgba(255,255,255,0.8)',
                color: isActive ? '#fff' : '#64748B',
                boxShadow: isActive ? '0 4px 14px rgba(15,23,42,0.25)' : '0 1px 4px rgba(15,23,42,0.06)',
                border: isActive ? 'none' : '1px solid rgba(226,232,240,0.8)',
              }}
            >
              {t.icon}
              {t.label}
            </motion.button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <AnimatePresence mode="wait">

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={24} style={{ color: '#3B82F6' }} />
                  </motion.div>
                </div>
              ) : analytics ? (
                <>
                  {/* KPI grid */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <KpiCard
                      icon={<FileText size={17} strokeWidth={2} />}
                      label="Jami arizalar"
                      value={analytics.totalReports}
                      sub="Barcha vaqt"
                      trend={12}
                      color="#3B82F6"
                      bg="rgba(59,130,246,0.1)"
                    />
                    <KpiCard
                      icon={<CheckCircle2 size={17} strokeWidth={2} />}
                      label="Hal etilgan"
                      value={`${analytics.resolvedPercent}%`}
                      sub={`${analytics.resolvedCount} ta ariza`}
                      trend={8}
                      color="#10B981"
                      bg="rgba(16,185,129,0.1)"
                    />
                    <KpiCard
                      icon={<Clock size={17} strokeWidth={2} />}
                      label="O'rt. hal vaqti"
                      value={`${analytics.avgResolutionDays} kun`}
                      sub="So'nggi 30 kun"
                      trend={-15}
                      color="#F59E0B"
                      bg="rgba(245,158,11,0.1)"
                    />
                    <KpiCard
                      icon={<Users size={17} strokeWidth={2} />}
                      label="Faol foydalanuvchi"
                      value={analytics.activeUsers}
                      sub="Bu oy"
                      trend={23}
                      color="#8B5CF6"
                      bg="rgba(139,92,246,0.1)"
                    />
                  </div>

                  {/* Extra stats row */}
                  <div className="flex gap-3">
                    <div
                      className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
                      style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
                    >
                      <ThumbsUp size={16} style={{ color: '#6366F1' }} strokeWidth={2} />
                      <div>
                        <div className="text-[17px] font-black" style={{ color: '#0F172A' }}>{analytics.totalVotes.toLocaleString()}</div>
                        <div className="text-[10px]" style={{ color: '#94A3B8' }}>Jami ovozlar</div>
                      </div>
                    </div>
                    <div
                      className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
                      style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
                    >
                      <AlertCircle size={16} style={{ color: '#EF4444' }} strokeWidth={2} />
                      <div>
                        <div className="text-[17px] font-black" style={{ color: '#0F172A' }}>{analytics.pendingCount}</div>
                        <div className="text-[10px]" style={{ color: '#94A3B8' }}>Kutilmoqda</div>
                      </div>
                    </div>
                  </div>

                  {/* Line chart — 7-kunlik trend */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Haftalik trend</p>
                        <p className="text-[11px]" style={{ color: '#94A3B8' }}>So'nggi 7 kun</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#3B82F6' }} />
                          <span className="text-[10px]" style={{ color: '#64748B' }}>Arizalar</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#10B981' }} />
                          <span className="text-[10px]" style={{ color: '#64748B' }}>Hal etildi</span>
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={analytics.dailyStats} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }}
                          labelStyle={{ fontWeight: 700, color: '#0F172A' }}
                        />
                        <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3, fill: '#3B82F6' }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar chart — kategoriyalar */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}
                  >
                    <div className="mb-4">
                      <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Kategoriyalar bo'yicha</p>
                      <p className="text-[11px]" style={{ color: '#94A3B8' }}>Jami va hal etilgan</p>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analytics.categoryStats} margin={{ left: -20, right: 8, top: 4, bottom: 0 }} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }}
                          labelStyle={{ fontWeight: 700, color: '#0F172A' }}
                        />
                        <Bar dataKey="count" name="Jami" radius={[4, 4, 0, 0]}>
                          {analytics.categoryStats.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                          ))}
                        </Bar>
                        <Bar dataKey="resolved" name="Hal etildi" fill="#10B981" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie chart — holat taqsimoti */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}
                  >
                    <div className="mb-2">
                      <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Holat taqsimoti</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={130} height={130}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={55} dataKey="value" stroke="none">
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={STATUS_COLORS[i]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2.5 flex-1">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[i] }} />
                              <span className="text-[12px]" style={{ color: '#475569' }}>{d.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{d.value}</span>
                              <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                                ({analytics ? Math.round((d.value / analytics.totalReports) * 100) : 0}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <motion.div
              key="reps"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {/* Search + filter */}
              <div className="flex gap-2 mt-1">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[12.5px] outline-none"
                    style={{
                      background: '#fff',
                      border: '1px solid rgba(226,232,240,0.8)',
                      color: '#0F172A',
                      boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
                    }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-[12px] font-semibold outline-none"
                    style={{
                      background: '#fff',
                      border: '1px solid rgba(226,232,240,0.8)',
                      color: '#475569',
                      boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
                    }}
                  >
                    <option value="all">Barchasi</option>
                    <option value="sent">Kutilmoqda</option>
                    <option value="in_progress">Jarayonda</option>
                    <option value="resolved">Hal etildi</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                </div>
              </div>

              <p className="text-[11px]" style={{ color: '#94A3B8' }}>{filteredReports.length} ta ariza topildi</p>

              {filteredReports.map((r, i) => {
                const st = STATUS_MAP[r.status]
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-4"
                    style={{
                      background: '#fff',
                      border: '1px solid rgba(226,232,240,0.8)',
                      boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                    }}
                  >
                    {/* Top row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: r.photoColor }}
                      >
                        {r.photoEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold" style={{ color: '#3B82F6' }}>{r.id}</span>
                          <span
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                            {st.label}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold leading-snug" style={{ color: '#0F172A' }}>{r.title}</p>
                        <p className="text-[10.5px] mt-0.5" style={{ color: '#94A3B8' }}>{r.address}</p>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mb-3 text-[10.5px]" style={{ color: '#94A3B8' }}>
                      <span>{r.username}</span>
                      <span>·</span>
                      <span>{r.createdAt}</span>
                      <span>·</span>
                      <ThumbsUp size={10} strokeWidth={2} />
                      <span>{r.votes}</span>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2">
                      {(['sent', 'in_progress', 'resolved'] as const).map((s) => {
                        const cfg = STATUS_MAP[s]
                        const isActive = r.status === s
                        return (
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            key={s}
                            disabled={isActive || updatingId === r.id}
                            onClick={() => handleStatusChange(r.id, s)}
                            className="flex-1 py-2 rounded-xl text-[10.5px] font-bold transition-all"
                            style={{
                              background: isActive ? cfg.bg : 'rgba(241,245,249,0.8)',
                              color: isActive ? cfg.color : '#94A3B8',
                              border: isActive ? `1.5px solid ${cfg.color}40` : '1.5px solid transparent',
                              opacity: updatingId === r.id && !isActive ? 0.5 : 1,
                            }}
                          >
                            {updatingId === r.id && !isActive ? '...' : cfg.label}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                )
              })}

              {filteredReports.length === 0 && (
                <div className="text-center py-16">
                  <FileText size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
                  <p className="text-[14px] font-bold" style={{ color: '#94A3B8' }}>Ariza topilmadi</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
