# Admin Panel Overhaul — Design Spec (Sub-loyiha 1: Frontend)

**Maqsad:** Admin.tsx ni responsive, professional, ko'p seksiyali admin paneliga aylantirish. Faqat frontend — backend o'zgarmaydi.

**Arxitektura:** Admin.tsx (orchestrator) + `components/admin/` ichida alohida komponentlar. Responsive: `< 768px` mobile tab-bar, `≥ 768px` desktop sidebar.

**Tech stack:** React 19, Tailwind CSS v4, Framer Motion, Recharts, Lucide React. Barcha mavjud kutubxonalar, yangi kutubxona qo'shilmaydi.

---

## Global Constraints

- Yangi npm package qo'shilmaydi — faqat mavjud kutubxonalar
- Tailwind v4 — `@apply` ishlatilmaydi, inline style + className kombinatsiyasi
- Breakpoint: `768px` (`md:`) — desktop/mobile chegarasi
- Barcha ranglar mavjud palitrada: `#0F172A`, `#3B82F6`, `#10B981`, `#F59E0B`, `#8B5CF6`, `#EF4444`, `#F8FAFC`
- Animatsiyalar: Framer Motion, mavjud `initial/animate/exit` pattern
- Uzbekcha UI matnlari — hech qanday ingliz matn foydalanuvchiga ko'rinmaydi
- Mock tashkilotlar ma'lumotlari `backend/mock/organizations.ts` da saqlanadi

---

## Fayl Tuzilmasi

**Yaratiladi:**
- `frontend/src/components/admin/AdminLayout.tsx` — responsive shell
- `frontend/src/components/admin/AdminDashboard.tsx` — dashboard seksiya
- `frontend/src/components/admin/AdminReports.tsx` — arizalar seksiya
- `frontend/src/components/admin/AdminOrganizations.tsx` — tashkilotlar seksiya
- `frontend/src/components/admin/AdminUsers.tsx` — foydalanuvchilar seksiya
- `frontend/src/components/admin/AdminAnalytics.tsx` — analytics seksiya
- `backend/mock/organizations.ts` — statik tashkilotlar mock data

**O'zgartiriladi:**
- `frontend/src/pages/Admin.tsx` — orchestrator, barcha data fetch shu yerda, komponentlarga props uzatiladi

---

## Komponentlar

### AdminLayout

Wrapper komponent. Barcha seksiyalar shu ichida render bo'ladi.

**Props:**
```typescript
interface AdminLayoutProps {
  activeSection: AdminSection
  onSectionChange: (s: AdminSection) => void
  onBack: () => void
  onRefresh: () => void
  loading: boolean
  children: React.ReactNode
}

type AdminSection = 'dashboard' | 'reports' | 'organizations' | 'users' | 'analytics' | 'map'
```

**Mobile layout (`< 768px`):**
- Header: `[← orqaga]  🛡 Admin Panel  [↻ yangilash]` — qora gradient background
- Tab bar: gorizontal scroll, 6 tab icon+label
- Content: `flex-1 overflow-y-auto`

**Desktop layout (`≥ 768px`):**
- `flex flex-row h-full`
- Sidebar chap: `200px` kenglik, qora (`#0F172A`) background, nav items vertikal
- Content o'ng: `flex-1`, header yo'q (sidebar ichida ko'rsatiladi)
- Sidebar nav item: active holat `bg-white/10`, hover `bg-white/5`

**Nav items (tartib bo'yicha):**

| ID | Icon | Label |
|----|------|-------|
| `dashboard` | `Activity` | Dashboard |
| `reports` | `FileText` | Arizalar |
| `organizations` | `Building2` | Tashkilotlar |
| `users` | `Users` | Foydalanuvchilar |
| `analytics` | `BarChart3` | Analytics |
| `map` | `Map` | Xarita |

---

### AdminDashboard

**Data sources:** `analytics: AdminAnalytics`, `reports: Report[]` (props sifatida keladi)

**KpiCard komponenti:** Hozir `Admin.tsx` ichida. Shu faylga — `AdminDashboard.tsx` ga ko'chiriladi. Boshqa komponentlar uni import qilmaydi.

**Layout:**
- Mobile: barcha elementlar `flex-col`
- Desktop: KPI kartalar `grid-cols-4`, chartlar `grid-cols-2`

**KPI kartalar (4 ta, KpiCard komponenti ishlatiladi):**
1. Jami arizalar — `analytics.total`, trend `+12%`
2. Hal etilgan — `byStatus.resolved / total * 100`%, trend `+8%`
3. O'rt. hal vaqti — `analytics.avgResolutionDays` kun, trend `-15%`
4. Kutilmoqda — `(byStatus.new ?? 0) + (byStatus.sent ?? 0)`, rang qizil

**Chartlar (mavjud, o'zgartirilmaydi):**
- Haftalik trend LineChart — `weeklyChartData`
- Kategoriyalar BarChart — `categoryChartData`
- Holat PieChart — `pieData`

**Yangi — Top-5 arizalar:**
- `reports` massivini `votes` bo'yicha kamayish tartibida saralab, birinchi 5 tasini ko'rsatadi
- Har biri: emoji + sarlavha + ovoz soni + status badge
- Card ichida, rounded-2xl

---

### AdminReports

**Data sources:** `reports: Report[]`, `onStatusChange: (id, status) => void` (props)

**Yangiliklar mavjud tabga nisbatan:**

1. **Kategoriya filter** — `select` element, `CATEGORIES` dan options, `statusFilter` yaniga `categoryFilter` state
2. **Pagination** — `page` state, `ITEMS_PER_PAGE = 20`, "Ko'proq yuklash" tugmasi (`page++`)
3. **Tashkilotga assign** — har ariza kartida "Yo'naltirish" tugmasi, bosilganda `disabled` holda `cursor-not-allowed` va tooltip: "Sub-loyiha 2 da faollashadi"
4. **Desktop grid** — `md:grid md:grid-cols-2` arizalar uchun

**Filter holati:**
```typescript
const [search, setSearch] = useState('')
const [statusFilter, setStatusFilter] = useState('all')
const [categoryFilter, setCategoryFilter] = useState('all')
const [page, setPage] = useState(1)
```

**Filterlash mantiqi:**
```typescript
const filtered = reports.filter(r => {
  const q = search.toLowerCase()
  const matchSearch = !q || r.title.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
  const matchStatus = statusFilter === 'all' || r.status === statusFilter
  const matchCategory = categoryFilter === 'all' || r.category === categoryFilter
  return matchSearch && matchStatus && matchCategory
})
const paginated = filtered.slice(0, page * ITEMS_PER_PAGE)
```

---

### AdminOrganizations

**Data source:** `backend/mock/organizations.ts` dan import (API yo'q — Sub-loyiha 2 da qo'shiladi)

**Mock organizations tuzilmasi:**
```typescript
export interface MockOrganization {
  id: string
  name: string           // "Toshkent shahar kommunal xizmatlari"
  shortName: string      // "Kommunal"
  icon: string           // emoji "🏛"
  category: string       // ariza kategoriyasiga mos: "Suv ta'minoti"
  district: string       // "Chilonzor tumani"
  phone: string
  totalAssigned: number  // mock raqam
  resolved: number       // mock raqam
  inProgress: number     // mock raqam
}
```

**Mock ma'lumotlar (10 ta tashkilot):**
```typescript
export const MOCK_ORGANIZATIONS: MockOrganization[] = [
  { id: 'org-1', name: 'Toshkent kommunal xizmatlari', shortName: 'Kommunal', icon: '🏛', category: 'Suv ta\'minoti', district: 'Barcha tumanlar', phone: '+998 71 123-45-67', totalAssigned: 48, resolved: 31, inProgress: 12 },
  { id: 'org-2', name: 'Yo\'l qurilish boshqarmasi', shortName: 'Yo\'l', icon: '🛣', category: 'Ko\'cha va yo\'llar', district: 'Barcha tumanlar', phone: '+998 71 234-56-78', totalAssigned: 36, resolved: 22, inProgress: 8 },
  { id: 'org-3', name: 'Chiqindilarni boshqarish', shortName: 'Chiqindi', icon: '♻️', category: 'Chiqindi', district: 'Barcha tumanlar', phone: '+998 71 345-67-89', totalAssigned: 29, resolved: 18, inProgress: 7 },
  { id: 'org-4', name: 'Ko\'kalamzorlashtirish boshqarmasi', shortName: 'Ko\'kat', icon: '🌳', category: 'Ko\'kalamzorlashtirish', district: 'Barcha tumanlar', phone: '+998 71 456-78-90', totalAssigned: 21, resolved: 15, inProgress: 4 },
  { id: 'org-5', name: 'Gaz ta\'minoti xizmati', shortName: 'Gaz', icon: '🔥', category: 'Gaz ta\'minoti', district: 'Barcha tumanlar', phone: '+998 71 567-89-01', totalAssigned: 18, resolved: 14, inProgress: 3 },
  { id: 'org-6', name: 'Elektr ta\'minoti xizmati', shortName: 'Elektr', icon: '⚡', category: 'Elektr ta\'minoti', district: 'Barcha tumanlar', phone: '+998 71 678-90-12', totalAssigned: 24, resolved: 16, inProgress: 6 },
  { id: 'org-7', name: 'Chilonzor tuman hokimligi', shortName: 'Chilonzor', icon: '🏢', category: 'Umumiy', district: 'Chilonzor tumani', phone: '+998 71 111-11-11', totalAssigned: 15, resolved: 10, inProgress: 3 },
  { id: 'org-8', name: 'Yunusobod tuman hokimligi', shortName: 'Yunusobod', icon: '🏢', category: 'Umumiy', district: 'Yunusobod tumani', phone: '+998 71 222-22-22', totalAssigned: 12, resolved: 8, inProgress: 3 },
  { id: 'org-9', name: 'Yakkasaroy tuman hokimligi', shortName: 'Yakkasaroy', icon: '🏢', category: 'Umumiy', district: 'Yakkasaroy tumani', phone: '+998 71 333-33-33', totalAssigned: 9, resolved: 6, inProgress: 2 },
  { id: 'org-10', name: 'Mahalla qo\'mitalar kengashi', shortName: 'Mahalla', icon: '🤝', category: 'Mahalla', district: 'Barcha tumanlar', phone: '+998 71 444-44-44', totalAssigned: 33, resolved: 20, inProgress: 9 },
]
```

**UI:**
- Sarlavha + qisqa izoh
- Har tashkilot: kengayuvchi karta (accordion)
  - Yopiq holat: icon + nom + `totalAssigned` ariza + `resolved/totalAssigned`% yechilgan
  - Ochiq holat: phone, district, progress bar (resolved/totalAssigned), 3 mini-stat (assigned/inProgress/resolved)
- Desktop: `grid-cols-2`

---

### AdminUsers

**Data source:** `GET /auth/leaderboard` — mavjud endpoint

**API response:**
```typescript
interface LeaderboardUser {
  telegramId: string
  firstName: string
  username?: string
  totalTickets: number
  xp: number
}
```

**UI:**
- Search by name/username
- Sort by: XP (default) | Ariza soni
- Har foydalanuvchi satri:
  - Avatar (birinchi harf, rangli doira)
  - Ism + @username
  - `totalTickets` ariza
  - `xp` XP
  - Faollik darajasi badge: `< 5 ariza` = "Yangi", `5-20` = "Faol", `> 20` = "Ekspert"
- Desktop: to'liq jadval (`table` element) — ustunlar: `#`, Avatar+Ism, Ariza, XP, Daraja
- Mobile: har foydalanuvchi uchun `rounded-2xl` karta — avatar doira (chap), ism + username (o'rta), XP + daraja badge (o'ng)

---

### AdminAnalytics

**Data source:** `reports: Report[]` (props), barcha hisob-kitob client-side

**Vaqt filtri state:**
```typescript
type Period = '7d' | '30d' | '90d' | 'all'
const [period, setPeriod] = useState<Period>('30d')
```

**Filterlangan reports:**
```typescript
const filtered = useMemo(() => {
  if (period === 'all') return reports
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const cutoff = Date.now() - days * 86400000
  return reports.filter(r => new Date(r.createdAt).getTime() > cutoff)
}, [reports, period])
```

**Ko'rsatilgan ma'lumotlar:**

1. **Umumiy statistika** — 4 karta:
   - Jami ariza (filterlangan), hal etilgan soni, hal etilish %, o'rtacha hal vaqti

2. **Kunlik trend** — LineChart:
   - X o'qi: tanlab olingan davr uchun kun/hafta
   - `7d` → 7 ta kun, `30d` → 30 ta kun, `90d` → haftalik yig'indi, `all` → oylik yig'indi
   - Ikki chiziq: arizalar va hal etilganlar

3. **Kategoriyalar bo'yicha hal etilish** — HorizontalBarChart:
   - Har kategoriya uchun hal etilish foizi
   - `resolved / (resolved + inProgress + pending) * 100`

4. **Og'irlik darajasi** — PieChart (3 sektor):
   - `low` / `medium` / `high` — har birining soni

---

## Admin.tsx (Orchestrator)

Data fetch mantiqini saqlaydi, barcha komponentlarga props uzatadi:

```typescript
interface AdminState {
  activeSection: AdminSection
  analytics: AdminAnalytics | null
  reports: Report[]
  loading: boolean
}
```

`loadData()` funksiyasi o'zgarmaydi (mavjud API calllar).

Yangi: `/auth/leaderboard` uchun alohida `useState<LeaderboardUser[]>([])` va `useEffect`.

---

## Xarita seksiyasi

`DistrictMap` komponenti o'zgarmaydi. AdminLayout ichida `activeSection === 'map'` da render bo'ladi.

---

## Responsive Breakpoint Strategiyasi

Tailwind `md:` (`768px`) ishlatiladi:

- Sidebar: `hidden md:flex flex-col w-[200px]`
- Tab bar: `flex md:hidden`
- KPI grid: `grid-cols-2 md:grid-cols-4`
- Charts: `flex-col md:grid md:grid-cols-2`
- Reports: `flex-col md:grid md:grid-cols-2`
- Organizations: `flex-col md:grid md:grid-cols-2`
- Users mobile: karta / Users desktop: `table`
