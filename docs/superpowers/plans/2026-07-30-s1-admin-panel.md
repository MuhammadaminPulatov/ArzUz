# S1: Admin Panel — Real Data & Bug Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin panelining barcha bo'limlarini real API ma'lumotlariga ulash, mavjud bug'larni tuzatish va tuman xaritasini haqiqiy ma'lumot bilan ta'minlash.

**Architecture:** Admin.tsx allaqachon real API-ga ulangan (tickets, analytics). Qolgan 3 ta muammo: (1) AdminUsers `totalTickets` field nomi noto'g'ri — leaderboard `reportCount` qaytaradi; (2) DistrictMap hardcoded; (3) Org assignment local state — DB-ga saqlanmaydi. Ticket modeliga `assignedOrgId`/`assignedOrgName` qo'shamiz va DistrictMap uchun yangi `/api/admin/districts` endpoint yaratamiz.

**Tech Stack:** React 19, TypeScript, Express, MongoDB/Mongoose, Tailwind CSS v4, Framer Motion

## Global Constraints

- Frontend: `frontend/src/` ichida, `frontend/src/lib/api.ts` orqali `api.get/patch` ishlatiladi
- Backend: `server/src/` ichida, barcha route'lar `{ ok: boolean; data: T }` formatida javob qaytaradi
- Barcha matnlar O'zbekcha (UI labels)
- Qo'shimcha npm package o'rnatilmaydi — faqat mavjud dependencies
- Commit har bir task oxirida
- TypeScript strict mode — `any` ishlatilmaydi

---

### Task 1: AdminUsers field nomi bug'ini tuzatish

**Muammo:** `AdminUsers.tsx:13` da `totalTickets` field ishlatilgan, lekin `/auth/leaderboard` `reportCount` qaytaradi. Natijada ariza soni har doim 0 ko'rinadi.

**Files:**
- Modify: `frontend/src/components/admin/AdminUsers.tsx`

**Interfaces:**
- Produces: `LeaderboardUser.reportCount: number` (o'rniga `totalTickets: number` o'chiriladi)

- [ ] **Step 1: AdminUsers.tsx ni o'qib tasdiqlash**

`frontend/src/components/admin/AdminUsers.tsx:6-11` ni o'qing. `LeaderboardUser` interface `totalTickets` ishlatayotganini ko'rasiz.

- [ ] **Step 2: Interface va hamma ishlatgan joylarini almashtirish**

`frontend/src/components/admin/AdminUsers.tsx` faylida `totalTickets` ni `reportCount` ga almashtiring:

```tsx
interface LeaderboardUser {
  telegramId: string
  firstName: string
  username?: string
  reportCount: number
  xp: number
}

type SortKey = 'xp' | 'reportCount'
```

Va `getLevel` funksiyasini:
```tsx
function getLevel(reportCount: number) {
  if (reportCount > 20) return { label: 'Ekspert',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' }
  if (reportCount >= 5)  return { label: 'Faol',     color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  }
  return                        { label: 'Yangi',    color: '#10B981', bg: 'rgba(16,185,129,0.1)'  }
}
```

State'ni: `useState<SortKey>('xp')` o'zgarishsiz qoladi.

Barcha `u.totalTickets` ni `u.reportCount` ga almashtiring (3 ta joy: table td, mobile card, sort).

select option'ni:
```tsx
<option value="reportCount">Ariza bo'yicha</option>
```

- [ ] **Step 3: Tekshirish**

```bash
cd frontend && pnpm build 2>&1 | grep -i error
```

Expected: 0 TypeScript xatosi

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/AdminUsers.tsx
git commit -m "fix: AdminUsers field name totalTickets → reportCount"
```

---

### Task 2: Backend — /api/admin/districts endpoint

**Files:**
- Modify: `server/src/routes/admin.ts`

**Interfaces:**
- Produces: `GET /api/admin/districts` → `{ ok: true, data: DistrictStat[] }`

```ts
interface DistrictStat {
  district: string
  total: number
  byCategory: Record<string, number>
  dominant: string
  dominantColor: string
}
```

- [ ] **Step 1: Mavjud test faylini tekshirish**

```bash
ls server/src/__tests__/
```

`admin.test.ts` mavjud. U yerga yangi test qo'shamiz.

- [ ] **Step 2: admin.test.ts ga test qo'shish**

`server/src/__tests__/admin.test.ts` faylini oching va oxiriga qo'shing:

```ts
describe('GET /api/admin/districts', () => {
  it('returns district stats array', async () => {
    const res = await request(app)
      .get('/api/admin/districts')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})
```

- [ ] **Step 3: Test ishlamayotganini tekshirish**

```bash
cd server && pnpm test -- --testPathPattern=admin 2>&1 | tail -20
```

Expected: "districts" test FAIL ("Not found" yoki 404)

- [ ] **Step 4: admin.ts ga endpoint qo'shish**

`server/src/routes/admin.ts` ga qo'shing (PATCH dan oldin):

```ts
const CATEGORY_COLORS: Record<string, string> = {
  road:     '#EF4444',
  light:    '#F59E0B',
  water:    '#3B82F6',
  electric: '#8B5CF6',
  trash:    '#10B981',
  tree:     '#10B981',
  building: '#6366F1',
  other:    '#94A3B8',
}

// GET /api/admin/districts
adminRouter.get('/districts', async (_req: Request, res: Response) => {
  const raw = await Ticket.aggregate([
    {
      $group: {
        _id: { district: '$district', category: '$category' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.district',
        total: { $sum: '$count' },
        categories: {
          $push: { category: '$_id.category', count: '$count' },
        },
      },
    },
  ])

  const stats = raw
    .filter((r) => r._id && r._id !== '')
    .map((r) => {
      const byCategory: Record<string, number> = {}
      for (const c of r.categories as Array<{ category: string; count: number }>) {
        byCategory[c.category] = c.count
      }
      const dominant = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'other'
      return {
        district: r._id as string,
        total: r.total as number,
        byCategory,
        dominant,
        dominantColor: CATEGORY_COLORS[dominant] ?? '#94A3B8',
      }
    })
    .sort((a, b) => b.total - a.total)

  res.json({ ok: true, data: stats })
})
```

- [ ] **Step 5: Test o'tishini tekshirish**

```bash
cd server && pnpm test -- --testPathPattern=admin 2>&1 | tail -20
```

Expected: barcha testlar PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/admin.ts server/src/__tests__/admin.test.ts
git commit -m "feat: add GET /api/admin/districts endpoint with real aggregation"
```

---

### Task 3: Frontend — DistrictMap real API-ga ulash

**Files:**
- Modify: `frontend/src/components/DistrictMap.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/districts` → `DistrictStat[]` (Task 2 dan)

```ts
interface DistrictStat {
  district: string
  total: number
  byCategory: Record<string, number>
  dominant: string
  dominantColor: string
}
```

- [ ] **Step 1: DistrictMap.tsx ni qayta yozish**

`frontend/src/components/DistrictMap.tsx` faylini to'liq almashtyiring:

```tsx
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../lib/api'

interface DistrictStat {
  district: string
  total: number
  byCategory: Record<string, number>
  dominant: string
  dominantColor: string
}

const DISTRICT_COORDS: Record<string, [number, number]> = {
  'Yunusobod tumani':        [41.335, 69.290],
  "Mirzo Ulug'bek tumani":   [41.311, 69.278],
  'Chilonzor tumani':        [41.281, 69.207],
  'Yakkasaroy tumani':       [41.278, 69.245],
  'Shayxontohur tumani':     [41.322, 69.242],
  'Olmazor tumani':          [41.340, 69.220],
  'Bektemir tumani':         [41.242, 69.282],
  'Sergeli tumani':          [41.252, 69.234],
  'Uchtepa tumani':          [41.287, 69.212],
  'Yashnobod tumani':        [41.302, 69.315],
  'Mirobod tumani':          [41.297, 69.265],
}

const CATEGORY_LABELS: Record<string, string> = {
  road:     "Yo'l",
  light:    'Chiroq',
  water:    'Suv',
  electric: 'Elektr',
  trash:    'Axlat',
  tree:     'Daraxt',
  building: 'Bino',
  other:    'Boshqa',
}

function radiusFor(total: number) {
  return Math.max(16, Math.min(46, 10 + Math.sqrt(total) * 6))
}

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

export default function DistrictMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const [districts, setDistricts] = useState<DistrictStat[]>([])

  useEffect(() => {
    api.get<DistrictStat[]>('/admin/districts').then(setDistricts).catch(() => {})
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current || districts.length === 0) return

    const map = L.map(containerRef.current, {
      center: [41.299, 69.24],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    districts.forEach((d) => {
      const coords = DISTRICT_COORDS[d.district]
      if (!coords) return
      const radius = radiusFor(d.total)

      const circle = L.circleMarker(coords, {
        radius,
        fillColor: d.dominantColor,
        fillOpacity: 0.75,
        color: '#fff',
        weight: 2.5,
      }).addTo(map)

      const categoryRows = Object.entries(d.byCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([key, count]) => {
          const p = pct(count, d.total)
          return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 0">
            <span style="color:#475569;font-size:11px">${CATEGORY_LABELS[key] ?? key}</span>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="height:4px;border-radius:999px;background:${d.dominantColor};width:${Math.max(18, p * 0.8)}px;opacity:0.85"></div>
              <span style="font-size:11px;font-weight:700;color:#0F172A">${count}</span>
            </div>
          </div>`
        }).join('')

      const popup = L.popup({
        closeButton: false,
        className: 'district-popup',
        offset: [0, -radius],
        minWidth: 190,
      }).setContent(`
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:4px 0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:13px;font-weight:800;color:#0F172A">${d.district}</div>
            <div style="background:${d.dominantColor};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px">${d.total} ta</div>
          </div>
          ${categoryRows}
        </div>
      `)

      circle.bindPopup(popup)
      circle.on('mouseover', () => circle.openPopup())
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [districts])

  const maxTotal = Math.max(...districts.map((x) => x.total), 1)

  return (
    <div className="flex flex-col gap-3">
      {districts.length === 0 && (
        <div className="rounded-2xl flex items-center justify-center" style={{ height: 360, background: '#fff', border: '1px solid rgba(226,232,240,0.8)' }}>
          <p className="text-[13px]" style={{ color: '#94A3B8' }}>Ma'lumot yuklanmoqda...</p>
        </div>
      )}
      {districts.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ height: 360, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>
      )}

      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
        <p className="text-[12px] font-bold mb-3" style={{ color: '#64748B' }}>ASOSIY KATEGORIYA</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Yo'l",    color: '#EF4444' },
            { label: 'Chiroq', color: '#F59E0B' },
            { label: 'Suv',    color: '#3B82F6' },
            { label: 'Axlat',  color: '#10B981' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[11.5px] font-semibold" style={{ color: '#475569' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {districts.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <p className="text-[13.5px] font-black mb-3" style={{ color: '#0F172A' }}>Muammo reytingi</p>
          {districts.map((d, i) => {
            const barW = Math.round((d.total / maxTotal) * 100)
            return (
              <div key={d.district} className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold w-4 text-right shrink-0" style={{ color: i < 3 ? d.dominantColor : '#94A3B8' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-semibold" style={{ color: '#0F172A' }}>{d.district}</span>
                    <span className="text-[11px] font-bold" style={{ color: d.dominantColor }}>{d.total} ta</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
                    <div className="h-full rounded-full" style={{ width: `${barW}%`, background: d.dominantColor, opacity: 0.8 }} />
                  </div>
                </div>
              </div>
            )
          })}
          {districts.length === 0 && (
            <p className="text-[12px] text-center py-4" style={{ color: '#94A3B8' }}>Hali ariza yo'q</p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build tekshirish**

```bash
cd frontend && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/DistrictMap.tsx
git commit -m "feat: DistrictMap fetches real district stats from /api/admin/districts"
```

---

### Task 4: Tashkilotga yo'naltirish — DB-ga saqlash

**Muammo:** `AssignOrgModal` orqali tashkilot tayinlash faqat local state-da saqlanadi. Sahifa yangilanganda yo'qoladi.

**Files:**
- Modify: `server/src/models/ticket.model.ts` — `assignedOrgId`, `assignedOrgName` fieldlari
- Modify: `server/src/routes/admin.ts` — PATCH whitelist yangilash
- Modify: `frontend/src/components/admin/AssignOrgModal.tsx`
- Modify: `frontend/src/pages/Admin.tsx` — `handleAssign` funksiyasi
- Modify: `frontend/src/components/admin/AdminReports.tsx` — `assignedOrgs` state olib tashlash

**Interfaces:**
- Consumes: `PATCH /api/admin/tickets/:id` with `{ assignedOrgId: string; assignedOrgName: string; status: 'in_progress' }`
- Produces: `AdminReports` props: `onAssign: (reportId: string, org: MockOrganization) => Promise<void>`

- [ ] **Step 1: Ticket modeliga field qo'shish**

`server/src/models/ticket.model.ts` da interface va schema-ga qo'shing:

Interface (TicketDoc ichiga):
```ts
assignedOrgId?: string
assignedOrgName?: string
```

Schema (voterIds dan keyin):
```ts
assignedOrgId:   { type: String, default: '' },
assignedOrgName: { type: String, default: '' },
```

- [ ] **Step 2: admin.ts PATCH whitelist yangilash**

`server/src/routes/admin.ts` da `allowed` arrayga qo'shing:
```ts
const allowed = ['status', 'aiTitle', 'aiDescription', 'department', 'severity', 'priority', 'channelMessageId', 'assignedOrgId', 'assignedOrgName']
```

- [ ] **Step 3: AdminReports.tsx qayta yozish**

`frontend/src/components/admin/AdminReports.tsx` Props interfaceiga qo'shing:
```tsx
interface Props {
  reports: Report[]
  onStatusChange: (id: string, status: Report['status']) => void
  onAssign: (reportId: string, org: MockOrganization) => Promise<void>
  updatingId: string | null
}
```

`assignedOrgs` va `assigningReport` state'larini o'chirib tashlaing. `handleAssign` ni:
```tsx
const handleAssign = async (org: MockOrganization) => {
  if (!assigningReport) return
  await onAssign(assigningReport.id, org)
  setAssigningReport(null)
}
```

Report cardda `assignedOrgs[r.id]` o'rniga `(r as Report & { assignedOrgName?: string }).assignedOrgName` ishlatiladi:
```tsx
{(r as Report & { assignedOrgName?: string }).assignedOrgName ? (
  <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
    style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
    <span>{(r as Report & { assignedOrgName?: string }).assignedOrgName}</span>
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
```

- [ ] **Step 4: Admin.tsx handleAssign va handleStatusChange yangilash**

`frontend/src/pages/Admin.tsx` ga `handleAssign` qo'shing:
```tsx
const handleAssign = async (id: string, org: MockOrganization) => {
  setUpdatingId(id)
  await api.patch(`/admin/tickets/${id}`, {
    assignedOrgId: org.id,
    assignedOrgName: org.name,
    status: 'in_progress' as const,
  }).catch(() => null)
  setReports(prev => prev.map(r =>
    r.id === id
      ? { ...r, status: 'in_progress' as const, assignedOrgName: org.name }
      : r
  ))
  setUpdatingId(null)
}
```

MockOrganization importini Admin.tsx ga qo'shing:
```tsx
import { type MockOrganization } from '@backend/mock/organizations'
```

AdminReports komponentiga `onAssign` prop qo'shing:
```tsx
<AdminReports reports={reports} onStatusChange={handleStatusChange} onAssign={handleAssign} updatingId={updatingId} />
```

- [ ] **Step 5: Build tekshirish**

```bash
cd frontend && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 6: Commit**

```bash
git add server/src/models/ticket.model.ts server/src/routes/admin.ts \
        frontend/src/components/admin/AdminReports.tsx frontend/src/pages/Admin.tsx
git commit -m "feat: persist org assignment to DB via PATCH /admin/tickets/:id"
```
