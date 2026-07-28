import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  FileText, CheckCircle2, Clock, Users,
  TrendingUp, TrendingDown, ThumbsUp, AlertCircle,
} from 'lucide-react'
import { CATEGORIES } from '../../data/mock'
import type { Report } from '../../types'

export interface AdminAnalytics {
  total: number
  byStatus: { new?: number; sent?: number; in_progress?: number; resolved?: number }
  avgResolutionDays: number
}

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  trend?: number
  color: string
  bg: string
}

function KpiCard({ icon, label, value, sub, trend, color, bg }: KpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
      style={{
        background: '#fff',
        boxShadow: '0 2px 16px rgba(15,23,42,0.07)',
        border: '1px solid rgba(226,232,240,0.8)',
      }}
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

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B']

interface Props {
  analytics: AdminAnalytics
  reports: Report[]
}

export default function AdminDashboard({ analytics, reports }: Props) {
  const pending = (analytics.byStatus.new ?? 0) + (analytics.byStatus.sent ?? 0)

  const pieData = [
    { name: 'Hal etildi', value: analytics.byStatus.resolved ?? 0 },
    { name: 'Jarayonda',  value: analytics.byStatus.in_progress ?? 0 },
    { name: 'Kutilmoqda', value: pending },
  ]

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    reports.forEach(r => {
      const cat = CATEGORIES.find(c => c.label === r.category) ?? CATEGORIES[CATEGORIES.length - 1]!
      const label = cat.icon + ' ' + r.category.split(' ')[0]
      counts[label] = (counts[label] ?? 0) + 1
    })
    return Object.entries(counts).map(([label, count]) => ({ label, count, resolved: 0 }))
  }, [reports])

  const weeklyChartData = useMemo(() => {
    const days: Record<string, number> = {}
    const now = Date.now()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      days[key] = 0
    }
    reports.forEach(r => {
      if (!r.createdAt) return
      const d = new Date(r.createdAt)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      if (key in days) days[key]++
    })
    return Object.entries(days).map(([date, count]) => ({ date, reports: count, resolved: 0 }))
  }, [reports])

  const top5 = useMemo(
    () => [...reports].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)).slice(0, 5),
    [reports],
  )

  const resolvedPct = analytics.total > 0
    ? Math.round(((analytics.byStatus.resolved ?? 0) / analytics.total) * 100)
    : 0

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-4">

      {/* KPI: 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<FileText size={17} strokeWidth={2} />}
          label="Jami arizalar" value={analytics.total}
          sub="Barcha vaqt" trend={12}
          color="#3B82F6" bg="rgba(59,130,246,0.1)"
        />
        <KpiCard
          icon={<CheckCircle2 size={17} strokeWidth={2} />}
          label="Hal etilgan" value={`${resolvedPct}%`}
          sub={`${analytics.byStatus.resolved ?? 0} ta ariza`} trend={8}
          color="#10B981" bg="rgba(16,185,129,0.1)"
        />
        <KpiCard
          icon={<Clock size={17} strokeWidth={2} />}
          label="O'rt. hal vaqti" value={`${analytics.avgResolutionDays} kun`}
          sub="So'nggi 30 kun" trend={-15}
          color="#F59E0B" bg="rgba(245,158,11,0.1)"
        />
        <KpiCard
          icon={<Users size={17} strokeWidth={2} />}
          label="Kutilmoqda" value={pending}
          sub="Javob kutmoqda"
          color="#EF4444" bg="rgba(239,68,68,0.1)"
        />
      </div>

      {/* Extra stats */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <ThumbsUp size={16} style={{ color: '#6366F1' }} strokeWidth={2} />
          <div>
            <div className="text-[17px] font-black" style={{ color: '#0F172A' }}>
              {reports.reduce((s, r) => s + (r.votes ?? 0), 0).toLocaleString()}
            </div>
            <div className="text-[10px]" style={{ color: '#94A3B8' }}>Jami ovozlar</div>
          </div>
        </div>
        <div className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <AlertCircle size={16} style={{ color: '#EF4444' }} strokeWidth={2} />
          <div>
            <div className="text-[17px] font-black" style={{ color: '#0F172A' }}>{pending}</div>
            <div className="text-[10px]" style={{ color: '#94A3B8' }}>Kutilmoqda</div>
          </div>
        </div>
      </div>

      {/* Charts: 1 col mobile, 2 col desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-4">

        <div className="rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Haftalik trend</p>
          <p className="text-[11px] mt-0.5 mb-4" style={{ color: '#94A3B8' }}>So'nggi 7 kun</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyChartData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }} />
              <Line type="monotone" dataKey="reports" name="Arizalar" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3, fill: '#3B82F6' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="resolved" name="Hal etildi" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Kategoriyalar bo'yicha</p>
          <p className="text-[11px] mt-0.5 mb-4" style={{ color: '#94A3B8' }}>Jami va hal etilgan</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryChartData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }} />
              <Bar dataKey="count" name="Jami" fill="#3B82F6" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Hal etildi" fill="#10B981" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <p className="text-[13.5px] font-black mb-3" style={{ color: '#0F172A' }}>Holat taqsimoti</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={55} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i] ?? '#94A3B8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5 flex-1">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i] ?? '#94A3B8' }} />
                    <span className="text-[12px]" style={{ color: '#475569' }}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{d.value}</span>
                    <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                      ({analytics.total > 0 ? Math.round((d.value / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Top-5 arizalar</p>
          <p className="text-[11px] mt-0.5 mb-3" style={{ color: '#94A3B8' }}>Eng ko'p ovoz to'plagan</p>
          <div className="flex flex-col gap-2.5">
            {top5.length === 0
              ? <p className="text-[12px] text-center py-4" style={{ color: '#94A3B8' }}>Ma'lumot yo'q</p>
              : top5.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="text-[11px] font-black w-4 text-center shrink-0" style={{ color: '#94A3B8' }}>{i + 1}</span>
                  <span className="text-lg">{r.photoEmoji}</span>
                  <span className="flex-1 text-[12px] font-semibold truncate" style={{ color: '#0F172A' }}>{r.title}</span>
                  <div className="flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: '#6366F1' }}>
                    <ThumbsUp size={11} /> {r.votes}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}
