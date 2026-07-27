# Admin Panel Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin.tsx ni responsive, professional, 6-seksiyali admin paneliga aylantirish (mobile tab-bar + desktop sidebar).

**Architecture:** Admin.tsx orchestrator bo'lib qoladi, data fetch qiladi va props uzatadi. Alohida komponentlar `frontend/src/components/admin/` ichida. Responsive breakpoint: `768px` (`md:`).

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, Recharts, Lucide React. Yangi package yo'q.

## Global Constraints

- Yangi npm package qo'shilmaydi — faqat mavjud kutubxonalar
- Tailwind v4 — `@apply` ishlatilmaydi, inline style + className kombinatsiyasi
- Breakpoint: `768px` (`md:`) — desktop/mobile chegarasi
- Ranglar: `#0F172A`, `#3B82F6`, `#10B981`, `#F59E0B`, `#8B5CF6`, `#EF4444`, `#F8FAFC`
- Barcha UI matnlari o'zbekcha
- `@backend` alias ishlaydi: `frontend/vite.config.ts` da `'@backend': path.resolve(__dirname, '../backend')` mavjud
- Build tekshiruvi: `cd frontend && pnpm build` — xato bo'lmasligi shart
- Dev server: `cd frontend && pnpm dev`

---

### Task 1: Mock organizations data

**Files:**
- Create: `backend/mock/organizations.ts`

**Interfaces:**
- Produces: `MockOrganization` interface va `MOCK_ORGANIZATIONS` array — Task 5 da import qilinadi

- [ ] **Step 1: Fayl yarating**

```typescript
// backend/mock/organizations.ts

export interface MockOrganization {
  id: string
  name: string
  shortName: string
  icon: string
  category: string
  district: string
  phone: string
  totalAssigned: number
  resolved: number
  inProgress: number
}

export const MOCK_ORGANIZATIONS: MockOrganization[] = [
  { id: 'org-1', name: "Toshkent kommunal xizmatlari", shortName: 'Kommunal', icon: '🏛', category: "Suv muammosi", district: 'Barcha tumanlar', phone: '+998 71 123-45-67', totalAssigned: 48, resolved: 31, inProgress: 12 },
  { id: 'org-2', name: "Yo'l qurilish boshqarmasi", shortName: "Yo'l", icon: '🛣', category: "Yo'l nosozligi", district: 'Barcha tumanlar', phone: '+998 71 234-56-78', totalAssigned: 36, resolved: 22, inProgress: 8 },
  { id: 'org-3', name: "Chiqindilarni boshqarish xizmati", shortName: 'Chiqindi', icon: '♻️', category: "Axlat muammosi", district: 'Barcha tumanlar', phone: '+998 71 345-67-89', totalAssigned: 29, resolved: 18, inProgress: 7 },
  { id: 'org-4', name: "Ko'kalamzorlashtirish boshqarmasi", shortName: "Ko'kat", icon: '🌳', category: "Ko'kalamzorlashtirish", district: 'Barcha tumanlar', phone: '+998 71 456-78-90', totalAssigned: 21, resolved: 15, inProgress: 4 },
  { id: 'org-5', name: "Gaz ta'minoti xizmati", shortName: 'Gaz', icon: '🔥', category: "Gaz muammosi", district: 'Barcha tumanlar', phone: '+998 71 567-89-01', totalAssigned: 18, resolved: 14, inProgress: 3 },
  { id: 'org-6', name: "Elektr ta'minoti xizmati", shortName: 'Elektr', icon: '⚡', category: "Elektr muammosi", district: 'Barcha tumanlar', phone: '+998 71 678-90-12', totalAssigned: 24, resolved: 16, inProgress: 6 },
  { id: 'org-7', name: "Chilonzor tuman hokimligi", shortName: 'Chilonzor', icon: '🏢', category: 'Umumiy', district: 'Chilonzor tumani', phone: '+998 71 111-11-11', totalAssigned: 15, resolved: 10, inProgress: 3 },
  { id: 'org-8', name: "Yunusobod tuman hokimligi", shortName: 'Yunusobod', icon: '🏢', category: 'Umumiy', district: 'Yunusobod tumani', phone: '+998 71 222-22-22', totalAssigned: 12, resolved: 8, inProgress: 3 },
  { id: 'org-9', name: "Yakkasaroy tuman hokimligi", shortName: 'Yakkasaroy', icon: '🏢', category: 'Umumiy', district: 'Yakkasaroy tumani', phone: '+998 71 333-33-33', totalAssigned: 9, resolved: 6, inProgress: 2 },
  { id: 'org-10', name: "Mahalla qo'mitalar kengashi", shortName: 'Mahalla', icon: '🤝', category: 'Mahalla', district: 'Barcha tumanlar', phone: '+998 71 444-44-44', totalAssigned: 33, resolved: 20, inProgress: 9 },
]
```

- [ ] **Step 2: Build tekshiring**

```bash
cd frontend && pnpm build
```

Kutilgan natija: `backend/mock/organizations.ts` hali import qilinmagani uchun build xatosiz o'tadi.

- [ ] **Step 3: Commit**

```bash
git add backend/mock/organizations.ts
git commit -m "feat: add mock organizations data for admin panel"
```

---

### Task 2: AdminLayout — responsive shell

**Files:**
- Create: `frontend/src/components/admin/AdminLayout.tsx`

**Interfaces:**
- Produces:
  - `AdminSection = 'dashboard' | 'reports' | 'organizations' | 'users' | 'analytics' | 'map'`
  - `AdminLayoutProps` interface
  - `default export AdminLayout`
- Consumes: faqat lucide-react va framer-motion (mavjud)

- [ ] **Step 1: `frontend/src/components/admin/` papkasini yarating va fayl yozing**

```typescript
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
```

- [ ] **Step 2: Build tekshiring**

```bash
cd frontend && pnpm build
```

Kutilgan: `AdminLayout.tsx` hali Admin.tsx da ishlatilmagani uchun `noUnusedLocals` xatosi yo'q (export file). Build o'tadi.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AdminLayout.tsx
git commit -m "feat: add AdminLayout responsive shell (sidebar + tab-bar)"
```

---

### Task 3: AdminDashboard — dashboard seksiya

**Files:**
- Create: `frontend/src/components/admin/AdminDashboard.tsx`

**Interfaces:**
- Consumes:
  - `AdminAnalytics = { total: number; byStatus: { new?: number; sent?: number; in_progress?: number; resolved?: number }; avgResolutionDays: number }` — Admin.tsx dan props
  - `Report` — from `../../types`
  - `CATEGORIES` — from `../../data/mock`
  - recharts, lucide-react, framer-motion (mavjud)
- Produces: `default export AdminDashboard`

- [ ] **Step 1: Fayl yozing**

```typescript
// frontend/src/components/admin/AdminDashboard.tsx
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
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 text-[11px] font-bold"
            style={{ color: trend >= 0 ? '#10B981' : '#EF4444' }}
          >
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
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl"
        style={{ background: color }}
      />
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
        <div
          className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
        >
          <ThumbsUp size={16} style={{ color: '#6366F1' }} strokeWidth={2} />
          <div>
            <div className="text-[17px] font-black" style={{ color: '#0F172A' }}>
              {reports.reduce((s, r) => s + (r.votes ?? 0), 0).toLocaleString()}
            </div>
            <div className="text-[10px]" style={{ color: '#94A3B8' }}>Jami ovozlar</div>
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
        >
          <AlertCircle size={16} style={{ color: '#EF4444' }} strokeWidth={2} />
          <div>
            <div className="text-[17px] font-black" style={{ color: '#0F172A' }}>{pending}</div>
            <div className="text-[10px]" style={{ color: '#94A3B8' }}>Kutilmoqda</div>
          </div>
        </div>
      </div>

      {/* Charts: 1 col mobile, 2 col desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-4">

        {/* Weekly trend */}
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

        {/* Category bar */}
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

        {/* Status pie */}
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

        {/* Top-5 most voted */}
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
```

- [ ] **Step 2: Build tekshiring**

```bash
cd frontend && pnpm build
```

Kutilgan: build o'tadi (fayl hali Admin.tsx dan ishlatilmaydi).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AdminDashboard.tsx
git commit -m "feat: add AdminDashboard component with responsive grid and top-5"
```

---

### Task 4: AdminReports — arizalar seksiya

**Files:**
- Create: `frontend/src/components/admin/AdminReports.tsx`

**Interfaces:**
- Consumes:
  - `reports: Report[]`
  - `onStatusChange: (id: string, status: Report['status']) => void`
  - `updatingId: string | null`
  - `CATEGORIES` from `../../data/mock`
- Produces: `default export AdminReports`

- [ ] **Step 1: Fayl yozing**

```typescript
// frontend/src/components/admin/AdminReports.tsx
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, FileText, ThumbsUp, Building2 } from 'lucide-react'
import { CATEGORIES } from '../../data/mock'
import type { Report } from '../../types'

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
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage]                   = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return reports.filter(r => {
      const matchSearch = !q
        || r.title.toLowerCase().includes(q)
        || r.id.toLowerCase().includes(q)
        || r.address.toLowerCase().includes(q)
      const matchStatus   = statusFilter   === 'all' || r.status   === statusFilter
      const matchCategory = categoryFilter === 'all' || r.category === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [reports, search, statusFilter, categoryFilter])

  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore   = paginated.length < filtered.length

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-3">

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[140px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Qidirish..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[12.5px] outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#0F172A', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-[12px] font-semibold outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#475569', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
          >
            <option value="all">Holat</option>
            <option value="new">Yangi</option>
            <option value="sent">Kutilmoqda</option>
            <option value="in_progress">Jarayonda</option>
            <option value="resolved">Hal etildi</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>

        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-[12px] font-semibold outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#475569', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
          >
            <option value="all">Kategoriya</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.label}>{c.icon} {c.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>
      </div>

      <p className="text-[11px]" style={{ color: '#94A3B8' }}>{filtered.length} ta ariza topildi</p>

      {/* Grid: 1 col mobile, 2 col desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-3 flex flex-col gap-3">
        {paginated.map((r, i) => {
          const st = STATUS_MAP[r.status] ?? STATUS_MAP['new']!
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl p-4"
              style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
            >
              {/* Top row */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: r.photoColor }}>
                  {r.photoEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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

              {/* Meta */}
              <div className="flex items-center gap-3 mb-3 text-[10.5px]" style={{ color: '#94A3B8' }}>
                <span>{r.username}</span><span>·</span>
                <span>{r.createdAt}</span><span>·</span>
                <ThumbsUp size={10} strokeWidth={2} /><span>{r.votes}</span>
              </div>

              {/* Status buttons */}
              <div className="flex gap-2 mb-2">
                {(['sent', 'in_progress', 'resolved'] as const).map(s => {
                  const cfg = STATUS_MAP[s]!
                  const isActive = r.status === s
                  return (
                    <motion.button
                      key={s}
                      whileTap={{ scale: 0.92 }}
                      disabled={isActive || updatingId === r.id}
                      onClick={() => onStatusChange(r.id, s)}
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

              {/* Assign placeholder */}
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
                style={{
                  background: 'rgba(241,245,249,0.5)',
                  color: '#CBD5E1',
                  border: '1px dashed #E2E8F0',
                  cursor: 'not-allowed',
                }}
                title="Sub-loyiha 2 da faollashadi"
              >
                <Building2 size={12} />
                Tashkilotga yo'naltirish
              </button>
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
        <button
          onClick={() => setPage(p => p + 1)}
          className="py-3 rounded-2xl text-[13px] font-bold w-full mt-1"
          style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#3B82F6', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
        >
          Ko'proq yuklash ({filtered.length - paginated.length} ta qoldi)
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build tekshiring**

```bash
cd frontend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AdminReports.tsx
git commit -m "feat: add AdminReports with category filter, pagination, assign placeholder"
```

---

### Task 5: AdminOrganizations — tashkilotlar seksiya

**Files:**
- Create: `frontend/src/components/admin/AdminOrganizations.tsx`

**Interfaces:**
- Consumes: `MOCK_ORGANIZATIONS, MockOrganization` from `@backend/mock/organizations`
- Produces: `default export AdminOrganizations`

- [ ] **Step 1: Fayl yozing**

```typescript
// frontend/src/components/admin/AdminOrganizations.tsx
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
            <div
              key={org.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}
            >
              {/* Header */}
              <button
                onClick={() => setExpanded(isOpen ? null : org.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(59,130,246,0.08)' }}
                >
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

              {/* Expanded */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      className="px-4 pb-4 flex flex-col gap-3"
                      style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}
                    >
                      <div className="flex flex-col gap-1.5 pt-3">
                        <div className="flex items-center gap-2 text-[12px]" style={{ color: '#64748B' }}>
                          <Phone size={13} /><span>{org.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]" style={{ color: '#64748B' }}>
                          <MapPin size={13} /><span>{org.district}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px]" style={{ color: '#64748B' }}>Hal etilish darajasi</span>
                          <span className="text-[11px] font-bold" style={{ color: '#10B981' }}>{resolvedPct}%</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${resolvedPct}%`, background: '#10B981', transition: 'width 0.5s ease' }}
                          />
                        </div>
                      </div>

                      {/* 3 mini stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Jami',      value: org.totalAssigned, color: '#3B82F6' },
                          { label: 'Jarayonda', value: org.inProgress,    color: '#F59E0B' },
                          { label: 'Hal etildi',value: org.resolved,      color: '#10B981' },
                        ].map(s => (
                          <div
                            key={s.label}
                            className="rounded-xl p-2.5 text-center"
                            style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.6)' }}
                          >
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
```

- [ ] **Step 2: Build tekshiring**

```bash
cd frontend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AdminOrganizations.tsx
git commit -m "feat: add AdminOrganizations accordion with mock data"
```

---

### Task 6: AdminUsers — foydalanuvchilar seksiya

**Files:**
- Create: `frontend/src/components/admin/AdminUsers.tsx`

**Interfaces:**
- Consumes: `api.get<LeaderboardUser[]>('/auth/leaderboard')` (mavjud endpoint)
- Produces: `default export AdminUsers`

- [ ] **Step 1: Fayl yozing**

```typescript
// frontend/src/components/admin/AdminUsers.tsx
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'

interface LeaderboardUser {
  telegramId: string
  firstName: string
  username?: string
  totalTickets: number
  xp: number
}

type SortKey = 'xp' | 'totalTickets'

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1']

function getLevel(totalTickets: number) {
  if (totalTickets > 20) return { label: 'Ekspert',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' }
  if (totalTickets >= 5) return { label: 'Faol',     color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  }
  return                        { label: 'Yangi',    color: '#10B981', bg: 'rgba(16,185,129,0.1)'  }
}

export default function AdminUsers() {
  const [users, setUsers]   = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('xp')

  useEffect(() => {
    api.get<LeaderboardUser[]>('/auth/leaderboard')
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = users.filter(u =>
      !q || u.firstName.toLowerCase().includes(q) || (u.username ?? '').toLowerCase().includes(q)
    )
    return [...list].sort((a, b) => b[sortBy] - a[sortBy])
  }, [users, search, sortBy])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div style={{
          width: 28, height: 28,
          border: '3px solid #3B82F6', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-3">
      <div>
        <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Foydalanuvchilar</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{users.length} ta ro'yxatdan o'tgan</p>
      </div>

      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism yoki username..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[12.5px] outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#0F172A', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
          />
        </div>
        <div className="relative">
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
            className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-[12px] font-semibold outline-none"
            style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', color: '#475569', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
          >
            <option value="xp">XP bo'yicha</option>
            <option value="totalTickets">Ariza bo'yicha</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(226,232,240,0.8)', background: 'rgba(248,250,252,0.8)' }}>
              {['#', 'Foydalanuvchi', 'Ariza', 'XP', 'Daraja'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const level = getLevel(u.totalTickets)
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length]!
              return (
                <tr key={u.telegramId}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(226,232,240,0.5)' : 'none' }}>
                  <td className="px-4 py-3 text-[12px]" style={{ color: '#94A3B8' }}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black text-white shrink-0"
                        style={{ background: color }}>
                        {u.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: '#0F172A' }}>{u.firstName}</p>
                        {u.username && <p className="text-[11px]" style={{ color: '#94A3B8' }}>@{u.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#0F172A' }}>{u.totalTickets}</td>
                  <td className="px-4 py-3 text-[13px] font-bold" style={{ color: '#6366F1' }}>{u.xp}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: level.bg, color: level.color }}>
                      {level.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-[13px]" style={{ color: '#94A3B8' }}>Foydalanuvchi topilmadi</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-2">
        {filtered.map((u, i) => {
          const level = getLevel(u.totalTickets)
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length]!
          return (
            <motion.div key={u.telegramId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black text-white shrink-0"
                style={{ background: color }}>
                {u.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: '#0F172A' }}>{u.firstName}</p>
                {u.username && <p className="text-[11px]" style={{ color: '#94A3B8' }}>@{u.username}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: level.bg, color: level.color }}>
                  {level.label}
                </span>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: '#94A3B8' }}>
                  <span>{u.totalTickets} ariza</span>
                  <span>·</span>
                  <span style={{ color: '#6366F1', fontWeight: 700 }}>{u.xp} XP</span>
                </div>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center py-12 text-[13px]" style={{ color: '#94A3B8' }}>Foydalanuvchi topilmadi</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build tekshiring**

```bash
cd frontend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AdminUsers.tsx
git commit -m "feat: add AdminUsers with leaderboard API, responsive table/cards"
```

---

### Task 7: AdminAnalytics — batafsil analytics seksiya

**Files:**
- Create: `frontend/src/components/admin/AdminAnalytics.tsx`

**Interfaces:**
- Consumes:
  - `reports: Report[]`
  - `avgResolutionDays: number` — API dan kelgan qiymat (Admin.tsx da analytics.avgResolutionDays)
  - `CATEGORIES` from `../../data/mock`
- Produces: `default export AdminAnalytics`

- [ ] **Step 1: Fayl yozing**

```typescript
// frontend/src/components/admin/AdminAnalytics.tsx
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

  const total    = filtered.length
  const resolved = filtered.filter(r => r.status === 'resolved').length
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0

  // Daily/weekly trend
  const trendData = useMemo(() => {
    const useWeekly = period === '90d' || period === 'all'
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

  // Category resolution %
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
      .map(([name, v]) => ({
        name,
        pct: v.total > 0 ? Math.round((v.resolved / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [filtered])

  // Severity
  const severityData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 }
    filtered.forEach(r => {
      if (r.severity in counts) counts[r.severity as keyof typeof counts]++
    })
    return [
      { name: 'Kam',    value: counts.low,    color: '#10B981' },
      { name: "O'rta",  value: counts.medium,  color: '#F59E0B' },
      { name: 'Yuqori', value: counts.high,    color: '#EF4444' },
    ]
  }, [filtered])

  const cardStyle = {
    background: '#fff',
    border: '1px solid rgba(226,232,240,0.8)',
    boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
  }

  return (
    <div className="px-4 pb-8 pt-1 flex flex-col gap-4">
      <div>
        <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Analytics</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Batafsil tahlil va statistika</p>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={{
              background: period === p ? '#0F172A' : '#fff',
              color:      period === p ? '#fff'     : '#64748B',
              border:     period === p ? 'none'     : '1px solid rgba(226,232,240,0.8)',
              boxShadow:  period === p
                ? '0 4px 14px rgba(15,23,42,0.25)'
                : '0 1px 4px rgba(15,23,42,0.05)',
            }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Jami ariza',      value: total,                   color: '#3B82F6' },
          { label: 'Hal etilgan',     value: resolved,                 color: '#10B981' },
          { label: 'Hal etilish %',   value: `${resolvedPct}%`,        color: '#8B5CF6' },
          { label: "O'rt. hal vaqti", value: `${avgResolutionDays} kun`, color: '#F59E0B' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={cardStyle}>
            <div className="text-[22px] font-black" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[11px] mt-1" style={{ color: '#64748B' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-4">

        {/* Trend */}
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

        {/* Category resolution % */}
        <div className="rounded-2xl p-4" style={cardStyle}>
          <p className="text-[13.5px] font-black" style={{ color: '#0F172A' }}>Kategoriya samaradorligi</p>
          <p className="text-[11px] mt-0.5 mb-4" style={{ color: '#94A3B8' }}>Hal etilish foizi</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', fontSize: 12 }}
                formatter={(v) => [`${v}%`, 'Hal etilish']}
              />
              <Bar dataKey="pct" name="Hal etilish %" fill="#8B5CF6" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity pie */}
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
```

- [ ] **Step 2: Build tekshiring**

```bash
cd frontend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AdminAnalytics.tsx
git commit -m "feat: add AdminAnalytics with period filter and 3 charts"
```

---

### Task 8: Admin.tsx refactor — orchestrator

**Files:**
- Modify: `frontend/src/pages/Admin.tsx` — to'liq almashtiriladi

**Interfaces:**
- Consumes: barcha admin komponentlar (Task 2–7), `DistrictMap`, `api`, `normalizeTicket`, `Report`
- Produces: `default export Admin` — `onBack: () => void` props bilan (o'zgarmaydi)

- [ ] **Step 1: Admin.tsx ni to'liq almashtiring**

```typescript
// frontend/src/pages/Admin.tsx
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminLayout, { type AdminSection } from '../components/admin/AdminLayout'
import AdminDashboard, { type AdminAnalytics } from '../components/admin/AdminDashboard'
import AdminReports from '../components/admin/AdminReports'
import AdminOrganizations from '../components/admin/AdminOrganizations'
import AdminUsers from '../components/admin/AdminUsers'
import AdminAnalytics from '../components/admin/AdminAnalytics'
import DistrictMap from '../components/DistrictMap'
import { api } from '../lib/api'
import { normalizeTicket } from '../hooks/useReports'
import type { Report } from '../types'

const EMPTY_ANALYTICS: AdminAnalytics = { total: 0, byStatus: {}, avgResolutionDays: 0 }

interface AdminProps { onBack: () => void }

export default function Admin({ onBack }: AdminProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [analytics, setAnalytics]         = useState<AdminAnalytics | null>(null)
  const [reports, setReports]             = useState<Report[]>([])
  const [loading, setLoading]             = useState(true)
  const [updatingId, setUpdatingId]       = useState<string | null>(null)

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get<AdminAnalytics>('/admin/analytics').catch(() => null),
      api.get<{ tickets: unknown[]; total: number }>('/admin/tickets').catch(() => null),
    ]).then(([aData, rData]) => {
      setAnalytics(aData ?? EMPTY_ANALYTICS)
      setReports((rData?.tickets ?? []).map(normalizeTicket))
      setLoading(false)
    })
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleStatusChange = useCallback(async (id: string, status: Report['status']) => {
    setUpdatingId(id)
    await api.patch(`/admin/tickets/${id}`, { status }).catch(() => null)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdatingId(null)
  }, [])

  const currentAnalytics = analytics ?? EMPTY_ANALYTICS

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F8FAFC' }}>
      <AdminLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onBack={onBack}
        onRefresh={loadData}
        loading={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div style={{
              width: 32, height: 32,
              border: '3px solid #3B82F6', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {activeSection === 'dashboard'     && (
                <AdminDashboard analytics={currentAnalytics} reports={reports} />
              )}
              {activeSection === 'reports'       && (
                <AdminReports reports={reports} onStatusChange={handleStatusChange} updatingId={updatingId} />
              )}
              {activeSection === 'organizations' && <AdminOrganizations />}
              {activeSection === 'users'         && <AdminUsers />}
              {activeSection === 'analytics'     && (
                <AdminAnalytics reports={reports} avgResolutionDays={currentAnalytics.avgResolutionDays} />
              )}
              {activeSection === 'map'           && (
                <div className="px-4 pb-8 pt-1">
                  <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>
                    Toshkent tumanlari xaritasi
                  </p>
                  <p className="text-[11px] mt-0.5 mb-3" style={{ color: '#94A3B8' }}>
                    Muammolar soni va taqsimoti
                  </p>
                  <DistrictMap />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </AdminLayout>
    </div>
  )
}
```

- [ ] **Step 2: Build tekshiring — bu eng muhim qadam**

```bash
cd frontend && pnpm build
```

Kutilgan: xatosiz build. Agar TypeScript xatosi bo'lsa:
- `noUnusedLocals` xatosi → import qilinmagan narsani o'chiring
- `Property does not exist` → type nomini tekshiring (AdminAnalytics, LeaderboardUser)
- `Cannot find module '@backend/mock/organizations'` → `backend/mock/organizations.ts` fayl mavjudligini tekshiring

- [ ] **Step 3: Dev serverda tekshiring**

```bash
cd frontend && pnpm dev
```

Browserda `http://localhost:8443` ga kiring. Profile tabini oching → Admin tugmasini bosing → Admin panel ochilishi kerak.
- Mobile viewport (< 768px): header + horizontal tab-bar ko'rinadi
- Desktop viewport (≥ 768px): sidebar ko'rinadi, tab-bar yo'qoladi
- Barcha 6 seksiya ochilishi kerak
- Tashkilotlar — 10 ta karta, accordion ishlaydi
- Dashboard — KPI, chartlar ko'rinadi

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Admin.tsx
git commit -m "feat: Admin panel overhaul — responsive layout, 6 sections, desktop sidebar"
```

- [ ] **Step 5: Production build va deploy**

```bash
cd frontend && pnpm build
```

Build muvaffaqiyatli bo'lsa, Vercel avtomatik deploy qiladi (main branch push qilingandan keyin). Yoki qo'lda:

```bash
vercel deploy --prod
```
