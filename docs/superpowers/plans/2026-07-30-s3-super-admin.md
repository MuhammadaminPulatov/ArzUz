# S3: Super Admin Paneli

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Super admin paneli — barcha adminlarni, tashkilotlarni va shahar miqyosidagi statistikani boshqaruvchi alohida panel.

**Architecture:** Super admin — oddiy adminga qaraganda yuqori ruxsat. `SUPER_ADMIN_TELEGRAM_IDS` env var orqali aniqlanadi. JWT da `isSuperAdmin` field. `superAdminOnly` middleware. `/api/superadmin/*` route prefiksi. Frontend: `SuperAdmin` sahifasi `?superadmin=1` URL param bilan ochiladi.

**Dependency:** S1 va S2 bajarilgan bo'lishi kerak (Organization model, assignedOrgId mavjud).

**Tech Stack:** React 19, TypeScript, Express, MongoDB/Mongoose, Tailwind CSS v4, Framer Motion, Lucide React, Recharts (allaqachon mavjud)

## Global Constraints

- Frontend: `frontend/src/` ichida
- Backend: `server/src/` ichida
- Barcha matnlar O'zbekcha
- API javoblar `{ ok: boolean; data: T }` formatida
- Super admin JWT secret — asosiy JWT secret bilan bir xil (`env.jwtSecret`)
- Commit har bir task oxirida

---

### Task 1: Backend — Super Admin auth va env

**Files:**
- Modify: `server/src/config/env.ts`
- Modify: `server/src/routes/auth.ts`
- Create: `server/src/middleware/superAdminOnly.ts`

**Interfaces:**
- Produces: JWT da `isSuperAdmin: boolean` field
- Produces: `superAdminOnly` middleware

- [ ] **Step 1: env.ts ga superAdminIds qo'shish**

`server/src/config/env.ts` da `env` object-ga qo'shing:
```ts
superAdminIds: (process.env['SUPER_ADMIN_TELEGRAM_IDS'] ?? '').split(',').filter(Boolean),
```

- [ ] **Step 2: auth.ts da JWT ga isSuperAdmin qo'shish**

`server/src/routes/auth.ts` da `POST /api/auth/telegram` handler ichida:
```ts
const isAdmin      = env.adminIds.includes(userData.telegramId)
const isSuperAdmin = env.superAdminIds.includes(userData.telegramId)

const token = jwt.sign(
  { telegramId: userData.telegramId, plan: user.plan, isAdmin, isSuperAdmin },
  env.jwtSecret,
  { expiresIn: '7d' },
)
```

Response da ham qo'shing:
```ts
data: {
  token,
  user: {
    telegramId: user.telegramId,
    username:   user.username,
    firstName:  user.firstName,
    xp:         user.xp,
    plan:       user.plan,
    isAdmin,
    isSuperAdmin,
  },
},
```

- [ ] **Step 3: superAdminOnly middleware yaratish**

`server/src/middleware/superAdminOnly.ts`:
```ts
import { type Request, type Response, type NextFunction } from 'express'

export function superAdminOnly(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: { isSuperAdmin?: boolean } }).user
  if (!user?.isSuperAdmin) {
    res.status(403).json({ ok: false, error: 'Super admin ruxsati kerak' })
    return
  }
  next()
}
```

- [ ] **Step 4: auth middleware'ni tekshirish — isSuperAdmin mavjudmi**

`server/src/middleware/auth.ts` ni o'qing. JWT decode qilganda `isSuperAdmin` ham req.user-ga o'tishi kerak. Agar `req.user = { telegramId, plan, isAdmin }` qaytarsa, yangilang:

```ts
;(req as Request & { user: { telegramId: string; plan: string; isAdmin: boolean; isSuperAdmin: boolean } }).user = {
  telegramId: payload.telegramId,
  plan: payload.plan ?? 'free',
  isAdmin: payload.isAdmin === true,
  isSuperAdmin: payload.isSuperAdmin === true,
}
```

- [ ] **Step 5: Build tekshirish**

```bash
cd server && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 6: Commit**

```bash
git add server/src/config/env.ts server/src/routes/auth.ts \
        server/src/middleware/superAdminOnly.ts server/src/middleware/auth.ts
git commit -m "feat: isSuperAdmin JWT claim + superAdminOnly middleware"
```

---

### Task 2: Backend — Super Admin API routes

**Files:**
- Create: `server/src/routes/superadmin.ts`
- Modify: `server/src/index.ts`

**Interfaces:**
- Produces:
  - `GET /api/superadmin/stats` → city-wide statistics
  - `GET /api/superadmin/organizations` → all orgs with real ticket counts
  - `POST /api/superadmin/organizations` → create new org
  - `DELETE /api/superadmin/organizations/:orgId` → remove org
  - `GET /api/superadmin/admins` → list all admin telegramIds + their actions

- [ ] **Step 1: superadmin.ts yaratish**

`server/src/routes/superadmin.ts`:

```ts
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { authMiddleware } from '../middleware/auth'
import { superAdminOnly } from '../middleware/superAdminOnly'
import { Ticket } from '../models/ticket.model'
import { Organization } from '../models/organization.model'
import { User } from '../models/user.model'
import { env } from '../config/env'

export const superAdminRouter = Router()
superAdminRouter.use(authMiddleware, superAdminOnly)

// GET /api/superadmin/stats
superAdminRouter.get('/stats', async (_req: Request, res: Response) => {
  const [
    totalTickets,
    byStatusRaw,
    byCategoryRaw,
    totalUsers,
    totalOrgs,
    avgArr,
  ] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Organization.countDocuments(),
    Ticket.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
      { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
      { $group: { _id: null, avg: { $avg: '$diff' } } },
    ]),
  ])

  const byStatus: Record<string, number> = {}
  for (const r of byStatusRaw) byStatus[r._id as string] = r.count as number

  const byCategory: Record<string, number> = {}
  for (const r of byCategoryRaw) byCategory[r._id as string] = r.count as number

  const avgMs = (avgArr[0]?.avg as number | undefined) ?? 0

  res.json({
    ok: true,
    data: {
      totalTickets,
      totalUsers,
      totalOrgs,
      byStatus,
      byCategory,
      avgResolutionDays: Math.round(avgMs / 86400000),
      resolved: byStatus['resolved'] ?? 0,
      inProgress: byStatus['in_progress'] ?? 0,
      pending: (byStatus['new'] ?? 0) + (byStatus['sent'] ?? 0),
    },
  })
})

// GET /api/superadmin/organizations
superAdminRouter.get('/organizations', async (_req: Request, res: Response) => {
  const orgs = await Organization.find().lean()

  const orgStats = await Promise.all(
    orgs.map(async (org) => {
      const [total, byStatusRaw] = await Promise.all([
        Ticket.countDocuments({ assignedOrgId: org.orgId }),
        Ticket.aggregate([
          { $match: { assignedOrgId: org.orgId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ])
      const byStatus: Record<string, number> = {}
      for (const r of byStatusRaw) byStatus[r._id as string] = r.count as number
      return {
        orgId:     org.orgId,
        name:      org.name,
        shortName: org.shortName,
        icon:      org.icon,
        category:  org.category,
        district:  org.district,
        phone:     org.phone,
        username:  org.username,
        totalAssigned: total,
        resolved:   byStatus['resolved'] ?? 0,
        inProgress: byStatus['in_progress'] ?? 0,
      }
    })
  )

  res.json({ ok: true, data: orgStats })
})

// POST /api/superadmin/organizations
superAdminRouter.post('/organizations', async (req: Request, res: Response) => {
  const { name, shortName, icon, category, district, phone, username, password } = req.body as Record<string, string>

  if (!name || !shortName || !username || !password || !category || !district) {
    res.status(400).json({ ok: false, error: 'name, shortName, category, district, username, password kerak' })
    return
  }

  const existing = await Organization.findOne({ username })
  if (existing) {
    res.status(409).json({ ok: false, error: 'Bu username allaqachon mavjud' })
    return
  }

  const count = await Organization.countDocuments()
  const orgId = `org-${count + 1}`
  const passwordHash = await bcrypt.hash(password, 10)

  const org = await Organization.create({
    orgId, name, shortName, icon: icon || '🏛', category, district,
    phone: phone || '', username, passwordHash,
  })

  res.json({ ok: true, data: { orgId: org.orgId, name: org.name, username: org.username } })
})

// DELETE /api/superadmin/organizations/:orgId
superAdminRouter.delete('/organizations/:orgId', async (req: Request, res: Response) => {
  const { orgId } = req.params
  const org = await Organization.findOneAndDelete({ orgId })
  if (!org) {
    res.status(404).json({ ok: false, error: 'Tashkilot topilmadi' })
    return
  }
  res.json({ ok: true, data: { orgId } })
})

// GET /api/superadmin/admins
superAdminRouter.get('/admins', async (_req: Request, res: Response) => {
  const adminIds = env.adminIds
  const superAdminIds = env.superAdminIds

  const adminUsers = await User.find({ telegramId: { $in: [...adminIds, ...superAdminIds] } })
    .select('telegramId firstName username xp reportCount lastActiveAt')
    .lean()

  const admins = [...adminIds, ...superAdminIds].map((id) => {
    const user = adminUsers.find((u) => u.telegramId === id)
    return {
      telegramId:  id,
      firstName:   user?.firstName ?? '—',
      username:    user?.username ?? '—',
      xp:          user?.xp ?? 0,
      reportCount: user?.reportCount ?? 0,
      lastActiveAt: user?.lastActiveAt ?? null,
      isSuperAdmin: superAdminIds.includes(id),
    }
  })

  res.json({ ok: true, data: admins })
})
```

- [ ] **Step 2: index.ts ga super admin router qo'shish**

`server/src/index.ts` da import:
```ts
import { superAdminRouter } from './routes/superadmin'
```

Route:
```ts
app.use('/api/superadmin', superAdminRouter)
```

- [ ] **Step 3: Build tekshirish**

```bash
cd server && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/superadmin.ts server/src/index.ts
git commit -m "feat: super admin API — stats, org management, admin list"
```

---

### Task 3: Frontend — SuperAdmin sahifasi

**Files:**
- Create: `frontend/src/pages/SuperAdmin.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/superadmin/stats`
  - `GET /api/superadmin/organizations`
  - `GET /api/superadmin/admins`
  - `POST /api/superadmin/organizations`
  - `DELETE /api/superadmin/organizations/:orgId`

- [ ] **Step 1: api.ts ga `del` method qo'shish**

`frontend/src/lib/api.ts` da `api` object-ga qo'shing:
```ts
del: <T>(path: string) => request<T>('DELETE', path),
```

- [ ] **Step 2: SuperAdmin.tsx yaratish**

`frontend/src/pages/SuperAdmin.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Users, Building2, BarChart2, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Zap, Plus, Trash2,
  Crown, FileText, TrendingUp,
} from 'lucide-react'
import { api } from '../lib/api'

interface SuperStats {
  totalTickets: number
  totalUsers: number
  totalOrgs: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  avgResolutionDays: number
  resolved: number
  inProgress: number
  pending: number
}

interface OrgStat {
  orgId: string
  name: string
  shortName: string
  icon: string
  category: string
  district: string
  username: string
  totalAssigned: number
  resolved: number
  inProgress: number
}

interface AdminEntry {
  telegramId: string
  firstName: string
  username: string
  xp: number
  reportCount: number
  lastActiveAt: string | null
  isSuperAdmin: boolean
}

type Section = 'stats' | 'orgs' | 'admins'

interface Props { onBack: () => void }

const SECTION_TABS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'stats',  label: 'Statistika',  icon: BarChart2   },
  { id: 'orgs',   label: 'Tashkilotlar', icon: Building2  },
  { id: 'admins', label: 'Adminlar',     icon: Shield     },
]

export default function SuperAdmin({ onBack }: Props) {
  const [section, setSection] = useState<Section>('stats')
  const [stats,   setStats]   = useState<SuperStats | null>(null)
  const [orgs,    setOrgs]    = useState<OrgStat[]>([])
  const [admins,  setAdmins]  = useState<AdminEntry[]>([])
  const [loading, setLoading] = useState(true)

  // New org form
  const [showAddOrg, setShowAddOrg] = useState(false)
  const [newOrg, setNewOrg] = useState({ name: '', shortName: '', icon: '🏛', category: '', district: 'Barcha tumanlar', phone: '', username: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, o, a] = await Promise.all([
        api.get<SuperStats>('/superadmin/stats'),
        api.get<OrgStat[]>('/superadmin/organizations'),
        api.get<AdminEntry[]>('/superadmin/admins'),
      ])
      setStats(s)
      setOrgs(o)
      setAdmins(a)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/superadmin/organizations', newOrg)
      setShowAddOrg(false)
      setNewOrg({ name: '', shortName: '', icon: '🏛', category: '', district: 'Barcha tumanlar', phone: '', username: '', password: '' })
      await loadAll()
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrg = async (orgId: string) => {
    setDeleting(orgId)
    try {
      await api.del(`/superadmin/organizations/${orgId}`)
      setOrgs(prev => prev.filter(o => o.orgId !== orgId))
    } catch { /* silent */ } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F0F4FF' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0"
        style={{ background: 'linear-gradient(150deg, #0F172A 0%, #1E293B 60%, #334155 100%)' }}>
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ChevronRight size={16} className="text-white" style={{ transform: 'rotate(180deg)' }} />
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.25)' }}>
              <Crown size={16} style={{ color: '#FCD34D' }} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[16px] font-black text-white leading-tight">Super Admin</h1>
              <p className="text-[10px]" style={{ color: '#94A3B8' }}>Tizim boshqaruvi</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Arizalar', value: stats.totalTickets, icon: FileText,  color: '#60A5FA' },
              { label: 'Foydalanuvchilar', value: stats.totalUsers, icon: Users, color: '#34D399' },
              { label: 'Tashkilotlar', value: stats.totalOrgs, icon: Building2, color: '#FCD34D' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <Icon size={14} strokeWidth={2} style={{ color: s.color }} className="mx-auto mb-1" />
                  <p className="text-[18px] font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[9px]" style={{ color: '#94A3B8' }}>{s.label}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5">
          {SECTION_TABS.map(tab => {
            const Icon = tab.icon
            const active = section === tab.id
            return (
              <motion.button key={tab.id} whileTap={{ scale: 0.93 }}
                onClick={() => setSection(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-bold flex-1 justify-center"
                style={{
                  background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#fff' : '#64748B',
                  border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                }}>
                <Icon size={13} strokeWidth={2.2} />
                {tab.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div style={{ width: 28, height: 28, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* STATS */}
            {section === 'stats' && stats && (
              <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">

                {/* KPI row */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Hal etildi', value: `${stats.totalTickets > 0 ? Math.round((stats.resolved / stats.totalTickets) * 100) : 0}%`, sub: `${stats.resolved} ta ariza`, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Jarayonda',  value: stats.inProgress,  sub: 'Ishlanmoqda',       icon: Clock,       color: '#3B82F6',  bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Kutilmoqda', value: stats.pending,     sub: 'Javob kutmoqda',    icon: AlertCircle, color: '#EF4444',  bg: 'rgba(239,68,68,0.1)' },
                    { label: "O'rt. hal",  value: `${stats.avgResolutionDays}k`, sub: 'Kun',  icon: TrendingUp,  color: '#8B5CF6',  bg: 'rgba(139,92,246,0.1)' },
                  ].map(kpi => {
                    const Icon = kpi.icon
                    return (
                      <div key={kpi.label} className="rounded-2xl p-3.5"
                        style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5"
                          style={{ background: kpi.bg }}>
                          <Icon size={15} style={{ color: kpi.color }} strokeWidth={2} />
                        </div>
                        <p className="text-[20px] font-black" style={{ color: '#0F172A' }}>{kpi.value}</p>
                        <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#64748B' }}>{kpi.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>{kpi.sub}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Category breakdown */}
                <div className="rounded-2xl p-4"
                  style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' }}>
                  <p className="text-[13.5px] font-black mb-3" style={{ color: '#0F172A' }}>Kategoriyalar bo'yicha</p>
                  {Object.entries(stats.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => {
                      const pct = stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0
                      return (
                        <div key={cat} className="flex items-center gap-3 mb-2.5">
                          <span className="text-[12px] w-20 truncate" style={{ color: '#475569' }}>{cat}</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#3B82F6' }} />
                          </div>
                          <span className="text-[12px] font-bold w-8 text-right" style={{ color: '#0F172A' }}>{count}</span>
                        </div>
                      )
                    })}
                </div>

              </motion.div>
            )}

            {/* ORGS */}
            {section === 'orgs' && (
              <motion.div key="orgs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddOrg(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                  <Plus size={16} strokeWidth={2.5} />
                  Yangi tashkilot qo'shish
                </motion.button>

                {orgs.map((org, i) => {
                  const resolvedPct = org.totalAssigned > 0 ? Math.round((org.resolved / org.totalAssigned) * 100) : 0
                  return (
                    <motion.div key={org.orgId}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="rounded-2xl p-4"
                      style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: 'rgba(59,130,246,0.08)' }}>
                          {org.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-bold truncate" style={{ color: '#0F172A' }}>{org.name}</p>
                            <motion.button whileTap={{ scale: 0.88 }}
                              disabled={deleting === org.orgId}
                              onClick={() => handleDeleteOrg(org.orgId)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-2"
                              style={{ background: 'rgba(239,68,68,0.08)' }}>
                              <Trash2 size={13} style={{ color: '#EF4444' }} strokeWidth={2} />
                            </motion.button>
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                            {org.category} · @{org.username}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[
                          { label: 'Jami', value: org.totalAssigned, color: '#3B82F6' },
                          { label: 'Jarayonda', value: org.inProgress, color: '#F59E0B' },
                          { label: 'Hal etildi', value: org.resolved, color: '#10B981' },
                        ].map(s => (
                          <div key={s.label} className="rounded-xl p-2 text-center"
                            style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(226,232,240,0.6)' }}>
                            <p className="text-[15px] font-black" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px]" style={{ color: '#94A3B8' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10.5px]" style={{ color: '#94A3B8' }}>Hal etish darajasi</span>
                          <span className="text-[10.5px] font-bold" style={{ color: '#10B981' }}>{resolvedPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${resolvedPct}%`, background: '#10B981' }} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {/* ADMINS */}
            {section === 'admins' && (
              <motion.div key="admins" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                <p className="text-[11px]" style={{ color: '#94A3B8' }}>{admins.length} ta admin ro'yxatda</p>
                {admins.map((a, i) => (
                  <motion.div key={a.telegramId}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-black text-white shrink-0"
                      style={{ background: a.isSuperAdmin ? 'linear-gradient(135deg, #F59E0B, #EF4444)' : 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
                      {a.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>{a.firstName}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: a.isSuperAdmin ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.1)',
                            color: a.isSuperAdmin ? '#92400E' : '#1D4ED8',
                          }}>
                          {a.isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                        {a.username !== '—' ? `@${a.username}` : a.telegramId} · {a.reportCount} ta ariza
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Zap size={11} style={{ color: '#6366F1' }} strokeWidth={2.5} />
                        <span className="text-[13px] font-black" style={{ color: '#0F172A' }}>{a.xp}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: '#94A3B8' }}>XP</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* Add org modal */}
      <AnimatePresence>
        {showAddOrg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAddOrg(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="w-full rounded-t-3xl p-6 flex flex-col gap-3"
              style={{ background: '#fff', maxHeight: '85vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <p className="text-[16px] font-black" style={{ color: '#0F172A' }}>Yangi tashkilot</p>
              <form onSubmit={handleAddOrg} className="flex flex-col gap-3">
                {[
                  { key: 'name', label: 'To\'liq nomi', placeholder: "Toshkent kommunal xizmatlari" },
                  { key: 'shortName', label: 'Qisqa nomi', placeholder: 'Kommunal' },
                  { key: 'icon', label: 'Emoji', placeholder: '🏛' },
                  { key: 'category', label: 'Kategoriya', placeholder: "Suv muammosi" },
                  { key: 'district', label: 'Tuman', placeholder: 'Barcha tumanlar' },
                  { key: 'phone', label: 'Telefon', placeholder: '+998 71 123-45-67' },
                  { key: 'username', label: 'Login', placeholder: 'kommunal' },
                  { key: 'password', label: 'Parol', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11.5px] font-bold mb-1 block" style={{ color: '#475569' }}>{f.label}</label>
                    <input
                      type={f.key === 'password' ? 'password' : 'text'}
                      value={newOrg[f.key as keyof typeof newOrg]}
                      onChange={e => setNewOrg(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required={['name', 'shortName', 'category', 'district', 'username', 'password'].includes(f.key)}
                      className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                      style={{ background: 'rgba(241,245,249,0.9)', border: '1.5px solid rgba(226,232,240,0.9)', color: '#0F172A' }}
                    />
                  </div>
                ))}
                <div className="flex gap-3 mt-1">
                  <motion.button type="button" whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddOrg(false)}
                    className="flex-1 py-3 rounded-2xl text-[13px] font-bold"
                    style={{ background: 'rgba(241,245,249,0.9)', color: '#64748B' }}>
                    Bekor qilish
                  </motion.button>
                  <motion.button type="submit" whileTap={{ scale: 0.95 }}
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: App.tsx ga SuperAdmin qo'shish**

`frontend/src/App.tsx` da import:
```tsx
import SuperAdmin from './pages/SuperAdmin'
```

State:
```tsx
const [showSuperAdmin, setShowSuperAdmin] = useState(false)
```

useEffect ichida:
```tsx
if (window.location.search.includes('superadmin=1')) setShowSuperAdmin(true)
```

Org overlay dan keyin super admin overlay:
```tsx
{/* Super admin overlay */}
<AnimatePresence>
  {showSuperAdmin && (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: '#F8FAFC' }}
    >
      <SuperAdmin onBack={() => setShowSuperAdmin(false)} />
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 3: Build tekshirish**

```bash
cd frontend && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/pages/SuperAdmin.tsx frontend/src/App.tsx
git commit -m "feat: SuperAdmin panel — stats, org management, admin list"
```

---

### Task 4: Super Admin .env konfiguratsiyasi

- [ ] **Step 1: .env.local ga qo'shish (lokal)**

`server/.env.local` da:
```
SUPER_ADMIN_TELEGRAM_IDS=YOUR_TELEGRAM_ID
```

`YOUR_TELEGRAM_ID` — @userinfobot dan olingan raqam.

- [ ] **Step 2: Vercel production uchun**

Vercel dashboard da `mahallfix-api` proyektida:
- Settings → Environment Variables
- `SUPER_ADMIN_TELEGRAM_IDS` = `YOUR_TELEGRAM_ID`

- [ ] **Step 3: Super Admin URL**

```
http://localhost:5174/?superadmin=1
```

Faqat `SUPER_ADMIN_TELEGRAM_IDS` da ko'rsatilgan Telegram ID bilan login bo'lgan user kirishi mumkin.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "docs: super admin env setup and access URL"
```
