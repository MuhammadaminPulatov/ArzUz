import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { CATEGORIES } from '../../data/mock'
import type { Report } from '../../types'

type Period = '7d' | '30d' | '90d' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  '7d':  '7 kun',
  '30d': '30 kun',
  '90d': '90 kun',
  'all': 'Hammasi',
}

interface Props {
  reports: Report[]
  avgResolutionDays: number
}

export default function AdminAnalytics({ reports, avgResolutionDays }: Props) {
  const [period, setPeriod] = useState<Period>('30d')

  const filtered = useMemo(() => {
    if (period === 'all') return reports
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const cutoff = Date.now() - days * 86400000
    return reports.filter(r => {
      const d = new Date(r.createdAt)
      return !isNaN(d.getTime()) && d.getTime() > cutoff
    })
  }, [reports, period])

  const total       = filtered.length
  const resolved    = filtered.filter(r => r.status === 'resolved').length
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0

  const trendData = useMemo(() => {
    const useWeekly  = period === '90d' || period === 'all'
    const bucketCount = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 13 : 26
    const msPerBucket = useWeekly ? 7 * 86400000 : 86400000
    const buckets: { date: string; reports: number; resolved: number }[] = []

    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * msPerBucket)
      const label = useWeekly
        ? `${d.getDate()}/${d.getMonth() + 1}`
        : `${d.getMonth() + 1}/${d.getDate()}`
      buckets.push({ date: label, reports: 0, resolved: 0 })
    }

    filtered.forEach(r => {
      const d = new Date(r.createdAt)
      if (isNaN(d.getTime())) return
      const age = Date.now() - d.getTime()
      const idx = bucketCount - 1 - Math.floor(age / msPerBucket)
      if (idx >= 0 && idx < bucketCount) {
        buckets[idx]!.reports++
        if (r.status === 'resolved') buckets[idx]!.resolved++
      }
    })
    return buckets
  }, [filtered, period])

  const categoryData = useMemo(() => {
    const stats: Record<string, { total: number; resolved: number }> = {}
    filtered.forEach(r => {
      const cat = CATEGORIES.find(c => c.label === r.category) ?? CATEGORIES[CATEGORIES.length - 1]!
      const key = cat.icon + ' ' + r.category.split(' ')[0]
      if (!stats[key]) stats[key] = { total: 0, resolved: 0 }
      stats[key]!.total++
      if (r.status === 'resolved') stats[key]!.resolved++
    })
    return Object.entries(stats)
      .map(([name, v]) => ({ name, pct: v.total > 0 ? Math.round((v.resolved / v.total) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct)
  }, [filtered])

  const severityData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 }
    filtered.forEach(r => { if (r.severity in counts) counts[r.severity as keyof typeof counts]++ })
    return [
      { name: 'Kam',    value: counts.low,    color: '#10B981' },
      { name: "O'rta",  value: counts.medium,  color: '#F59E0B' },
      { name: 'Yuqori', value: counts.high,    color: '#EF4444' },
    ]
  }, [filtered])

  const cardStyle = { background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-4">
      <div>
        <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Analytics</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Batafsil tahlil va statistika</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className="px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={{
              background: period === p ? '#0F172A' : '#fff',
              color:      period === p ? '#fff'     : '#64748B',
              border:     period === p ? 'none'     : '1px solid rgba(226,232,240,0.8)',
              boxShadow:  period === p ? '0 4px 14px rgba(15,23,42,0.25)' : '0 1px 4px rgba(15,23,42,0.05)',
            }}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Jami ariza',        value: total,                      color: '#3B82F6' },
          { label: 'Hal etilgan',        value: resolved,                    color: '#10B981' },
          { label: 'Hal etilish %',      value: `${resolvedPct}%`,           color: '#8B5CF6' },
          { label: "O'rt. hal vaqti",    value: `${avgResolutionDays} kun`,  color: '#F59E0B' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={cardStyle}>
            <div className="text-[22px] font-black" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[11px] mt-1" style={{ color: '#64748B' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-4">

        <div className="rounded-2xl p-4" style={cardStyle}>
          <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Kunlik trend</p>
          <p className="text-[11px] mt-0.5 mb-4" style={{ color: '#94A3B8' }}>Arizalar va hal etilganlar</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }} />
              <Line type="monotone" dataKey="reports"  name="Arizalar"   stroke="#3B82F6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="resolved" name="Hal etildi" stroke="#10B981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4" style={cardStyle}>
          <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Kategoriya samaradorligi</p>
          <p className="text-[11px] mt-0.5 mb-4" style={{ color: '#94A3B8' }}>Hal etilish foizi</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }}
                formatter={v => [`${v}%`, 'Hal etilish']} />
              <Bar dataKey="pct" name="Hal etilish %" fill="#8B5CF6" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4" style={cardStyle}>
          <p className="text-[13.5px] font-black mb-3" style={{ color: '#0F172A' }}>Og'irlik darajasi</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={36} outerRadius={55} dataKey="value" stroke="none">
                  {severityData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5 flex-1">
              {severityData.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-[12px]" style={{ color: '#475569' }}>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: '#0F172A' }}>{s.value}</span>
                    <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                      ({total > 0 ? Math.round((s.value / total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
