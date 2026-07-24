# Project Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loyihani `/frontend`, `/backend`, `/claude` papkalar bilan toza, professional strukturaga o'tkazish.

**Architecture:** Barcha React/Vite fayllari `frontend/` ga ko'chiriladi va ichki struktura (`types/`, `hooks/`, `lib/`) ajratiladi. Mock data `backend/mock/` ga o'tkaziladi, service shablonlari yaratiladi. Claude workflow `claude/` da joylashadi. `vite.config.ts` `../.figma/` yo'li va `@backend` aliasi bilan yangilanadi.

**Tech Stack:** React 19, Vite 8, TypeScript 5.7, Tailwind CSS v4, Framer Motion, Leaflet, pnpm

## Global Constraints

- `.figma/` papkasi root da qoladi — Figma Make integratsiyasi uchun
- `node_modules/` root dan o'chiriladi, `frontend/` da qayta o'rnatiladi
- `package-lock.json` (eski npm lock) o'chiriladi — loyiha pnpm ishlatadi
- Barcha import yo'llari TypeScript `paths` va Vite alias bilan aniqlanadi
- `@` alias → `frontend/src/`, `@backend` alias → `backend/`
- Mavjud UI xulq-atvori o'zgarmaydi
- Dev server `frontend/` papkadan ishga tushiriladi: `cd frontend && pnpm dev`

---

### Task 1: Scaffold backend/ va claude/ papkalar, backend fayllarini yaratish

**Files:**
- Create: `backend/types/index.ts`
- Create: `backend/mock/reports.ts`
- Create: `backend/mock/badges.ts`
- Create: `backend/services/reports.service.ts`
- Create: `backend/services/badges.service.ts`
- Create: `backend/README.md`
- Create: `claude/hooks/README.md`
- Create: `claude/skills/README.md`

**Interfaces:**
- Produces: `backend/types` — `Report`, `Badge`, `Category`; `backend/mock` — barcha ma'lumotlar; `backend/services` — async service shablonlari

- [ ] **Step 1: Papkalar yaratish**

```bash
mkdir -p backend/mock backend/services backend/types
mkdir -p claude/hooks claude/skills
```

- [ ] **Step 2: `backend/types/index.ts` yaratish**

```ts
export interface Report {
  id: string
  userId: string
  username: string
  userAvatar: string
  category: string
  categoryIcon: string
  categoryColor: string
  title: string
  description: string
  address: string
  lat: number
  lng: number
  photoColor: string
  photoEmoji: string
  status: 'sent' | 'in_progress' | 'resolved'
  votes: number
  hasVoted: boolean
  createdAt: string
  aiSummary: string
  severity: 'low' | 'medium' | 'high'
  supporterAvatars: string[]
}

export interface Badge {
  id: string
  icon: string
  name: string
  description: string
  earned: boolean
  xpReward: number
  progress?: number
  total?: number
}

export interface Category {
  id: string
  icon: string
  label: string
  color: string
  bg: string
}
```

- [ ] **Step 3: `backend/mock/reports.ts` yaratish**

```ts
import type { Report, Category } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'road', icon: '🚧', label: "Yo'l nosozligi", color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  { id: 'light', icon: '💡', label: "Chiroq nosozligi", color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { id: 'water', icon: '💧', label: "Suv muammosi", color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { id: 'electric', icon: '⚡', label: "Elektr muammosi", color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { id: 'trash', icon: '🗑️', label: "Axlat muammosi", color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { id: 'tree', icon: '🌳', label: "Ko'kalamzorlashtirish", color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  { id: 'building', icon: '🏚️', label: "Bino nosozligi", color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  { id: 'other', icon: '📋', label: "Boshqa muammo", color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
]

export const SAMPLE_REPORTS: Report[] = [
  {
    id: 'ARZ-1008',
    userId: 'u2',
    username: 'Sardor T.',
    userAvatar: 'S',
    category: "Yo'l nosozligi",
    categoryIcon: '🚧',
    categoryColor: '#EF4444',
    title: "Chorsu ko'chasida katta chuqur",
    description: "Ko'chaning markazida 40 sm li chuqur bor, avtomobillar shikastlanmoqda. Zudlik bilan ta'mirlash kerak.",
    address: "Toshkent sh., Chorsu, Amir Temur ko'ch.",
    lat: 41.2995,
    lng: 69.2401,
    photoColor: '#DBEAFE',
    photoEmoji: '🚧',
    status: 'in_progress',
    votes: 47,
    hasVoted: false,
    createdAt: '2 soat oldin',
    aiSummary: "Yo'l yuzasida havfli jarlik aniqlandi. O'rtacha og'irlik: yuqori. Tezkor aralashuv tavsiya etiladi.",
    severity: 'high',
    supporterAvatars: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'ARZ-1007',
    userId: 'u3',
    username: 'Malika R.',
    userAvatar: 'M',
    category: "Chiroq nosozligi",
    categoryIcon: '💡',
    categoryColor: '#F59E0B',
    title: "3-mavzeda 6 ta chiroq ishlamaydi",
    description: "Kecha tundan beri 3-mavze bosh ko'chasidagi chiroqlar o'chib qolgan. Xavfsizlik muammosi.",
    address: "Mirzo Ulug'bek, 3-mavze",
    lat: 41.3110,
    lng: 69.2789,
    photoColor: '#FEF3C7',
    photoEmoji: '💡',
    status: 'sent',
    votes: 23,
    hasVoted: false,
    createdAt: '5 soat oldin',
    aiSummary: "Ko'cha yoritish tizimida uzilish aniqlandi. 6 ta chiroq ishlamayapti. O'rta darajali muammo.",
    severity: 'medium',
    supporterAvatars: ['E', 'F', 'G'],
  },
  {
    id: 'ARZ-1006',
    userId: 'u4',
    username: 'Jahongir K.',
    userAvatar: 'J',
    category: "Suv muammosi",
    categoryIcon: '💧',
    categoryColor: '#3B82F6',
    title: "Uchtepa, suv quvuri yorilgan",
    description: "Ko'chada suv sizib chiqmoqda, asfalt ostidan buloq oqyapti deyarli. Suv isrof bo'lmoqda.",
    address: "Uchtepa, Bog'ishamol ko'ch., 12",
    lat: 41.2850,
    lng: 69.2550,
    photoColor: '#E0F2FE',
    photoEmoji: '💧',
    status: 'in_progress',
    votes: 18,
    hasVoted: true,
    createdAt: 'Kecha',
    aiSummary: "Yer osti suv quvurida sizib chiqish aniqlandi. Suv yo'qotish: taxminan 200 litr/soat. Zudlik talab etiladi.",
    severity: 'high',
    supporterAvatars: ['H', 'I'],
  },
  {
    id: 'ARZ-1005',
    userId: 'u5',
    username: 'Nodira A.',
    userAvatar: 'N',
    category: "Axlat muammosi",
    categoryIcon: '🗑️',
    categoryColor: '#10B981',
    title: "Yunusobod 7-mavze, axlat 4 kun yig'ilmagan",
    description: "Axlat qutilar to'lib ketgan, hid chiqmoqda. Bolalar o'ynagan joy yonida, sanitariya muammosi.",
    address: "Yunusobod, 7-mavze, 3-tor ko'cha",
    lat: 41.3300,
    lng: 69.2900,
    photoColor: '#D1FAE5',
    photoEmoji: '🗑️',
    status: 'resolved',
    votes: 31,
    hasVoted: false,
    createdAt: '2 kun oldin',
    aiSummary: "Uy-joy hududida axlat to'planishi aniqlandi. Sanitariya xavfi: o'rta. Axlat yig'ish jadvalini tiklash zarur.",
    severity: 'medium',
    supporterAvatars: ['J', 'K', 'L', 'M', 'N'],
  },
]
```

- [ ] **Step 4: `backend/mock/badges.ts` yaratish**

```ts
import type { Badge } from '../types'

export const BADGES: Badge[] = [
  { id: 'first', icon: '🌱', name: 'Birinchi qadam', description: 'Birinchi arizangizni yubordingiz', earned: true, xpReward: 50 },
  { id: 'voter', icon: '👍', name: 'Jamoat ovozi', description: "10 ta arizani qo'llab-quvvatlang", earned: true, xpReward: 30, progress: 10, total: 10 },
  { id: 'reporter5', icon: '📋', name: 'Faol fuqaro', description: '5 ta ariza yuboring', earned: true, xpReward: 100, progress: 5, total: 5 },
  { id: 'reporter10', icon: '🏆', name: 'Mahalla qahramoni', description: '10 ta ariza yuboring', earned: false, xpReward: 200, progress: 5, total: 10 },
  { id: 'resolved', icon: '✅', name: 'Hal etuvchi', description: 'Arizangiz hal etildi', earned: true, xpReward: 150 },
  { id: 'streak', icon: '🔥', name: 'Ketma-ket 7 kun', description: '7 kun ketma-ket faollik', earned: false, xpReward: 75, progress: 3, total: 7 },
  { id: 'popular', icon: '⭐', name: 'Ommalashgan ariza', description: 'Arizangizga 20+ ovoz berildi', earned: false, xpReward: 120, progress: 14, total: 20 },
  { id: 'verified', icon: '💎', name: 'Ishonchli fuqaro', description: 'Barcha arizalar tasdiqlangan', earned: true, xpReward: 300 },
]
```

- [ ] **Step 5: `backend/services/reports.service.ts` yaratish**

```ts
import type { Report, Category } from '../types'
import { SAMPLE_REPORTS, CATEGORIES } from '../mock/reports'

export async function getReports(): Promise<Report[]> {
  return SAMPLE_REPORTS
}

export async function getCategories(): Promise<Category[]> {
  return CATEGORIES
}

export async function createReport(
  data: Omit<Report, 'id' | 'votes' | 'hasVoted' | 'createdAt' | 'supporterAvatars'>
): Promise<Report> {
  return {
    ...data,
    id: `ARZ-${1000 + Math.floor(Math.random() * 9000)}`,
    votes: 0,
    hasVoted: false,
    createdAt: 'Hozir',
    supporterAvatars: [],
  }
}

export async function voteReport(_id: string, _hasVoted: boolean): Promise<void> {
  // Real API call bu yerga qo'shiladi
}
```

- [ ] **Step 6: `backend/services/badges.service.ts` yaratish**

```ts
import type { Badge } from '../types'
import { BADGES } from '../mock/badges'

export async function getBadges(): Promise<Badge[]> {
  return BADGES
}

export async function awardBadge(_userId: string, _badgeId: string): Promise<void> {
  // Real API call bu yerga qo'shiladi
}
```

- [ ] **Step 7: `backend/README.md` yaratish**

```md
# Backend

Hozircha mock data ishlatilmoqda. Real backend qo'shilganda:

1. `services/` funksiyalarini haqiqiy API chaqiruvlari bilan almashtiring
2. `mock/` papkani o'chiring yoki test uchun qoldiring
3. `types/index.ts` ni backend sxemasi bilan moslashtiring

## Papka tuzilmasi

- `mock/` — Statik test ma'lumotlari (SAMPLE_REPORTS, CATEGORIES, BADGES)
- `services/` — Ma'lumot olish/yuborish funksiyalari (API abstraction layer)
- `types/` — TypeScript interfeyslari
```

- [ ] **Step 8: `claude/hooks/README.md` va `claude/skills/README.md` yaratish**

`claude/hooks/README.md`:
```md
# Claude Hooks

Claude Code hooks — muayyan hodisalarda avtomatik ishga tushadigan shell buyruqlari.

Sozlash: `.claude/settings.json` → `hooks` bo'limi.
```

`claude/skills/README.md`:
```md
# Claude Skills

Loyiha uchun maxsus Claude skills va prompt shablonlari.

Qo'shish uchun: `/claude/skills/<skill-name>/SKILL.md` faylini yarating.
```

- [ ] **Step 9: Commit**

```bash
git add backend/ claude/hooks/ claude/skills/
git commit -m "feat: scaffold backend/ and claude/ structure with mock data"
```

---

### Task 2: Frontend fayllari ko'chirish va konfiguratsiyani yangilash

**Files:**
- Move: `src/` → `frontend/src/`
- Move: `index.html` → `frontend/index.html`
- Move: `package.json` → `frontend/package.json`
- Move: `pnpm-lock.yaml` → `frontend/pnpm-lock.yaml`
- Move: `tsconfig.json` → `frontend/tsconfig.json`
- Move: `vite.config.ts` → `frontend/vite.config.ts`
- Delete: `package-lock.json` (eski npm lock, ishlatilmaydi)
- Modify: `frontend/vite.config.ts` — `.figma` yo'li va `@backend` alias
- Modify: `frontend/tsconfig.json` — `paths` va `include` yangilanadi

**Interfaces:**
- Consumes: barcha mavjud fayllar
- Produces: `frontend/` da to'liq ishlaydigan React+Vite ilova

- [ ] **Step 1: `frontend/` papkasini yaratib fayllarni ko'chirish**

```bash
mkdir -p frontend
mv src frontend/src
mv index.html frontend/index.html
mv package.json frontend/package.json
mv pnpm-lock.yaml frontend/pnpm-lock.yaml
mv tsconfig.json frontend/tsconfig.json
mv vite.config.ts frontend/vite.config.ts
rm -f package-lock.json
```

- [ ] **Step 2: `frontend/vite.config.ts` yangilash**

`import siteConfiguration from './.figma/make/site.json'` qatorini o'zgartirish:

```ts
import siteConfiguration from '../.figma/make/site.json'
```

Resolve alias bo'limini `@backend` bilan kengaytirish:

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@backend': path.resolve(__dirname, '../backend'),
  },
},
```

`storiesGlob` ni yangilash (Vite root endi `frontend/` bo'lgani uchun `/src/` to'g'ri qoladi):

```ts
figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
```

- [ ] **Step 3: `frontend/tsconfig.json` yangilash**

To'liq kontent:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@backend/*": ["../backend/*"]
    },
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts", "../backend"]
}
```

- [ ] **Step 4: `node_modules` ni `frontend/` ga o'rnatish**

```bash
cd frontend && pnpm install
```

Expected: `frontend/node_modules/` yaratiladi, pnpm lock yangilanmaydi.

- [ ] **Step 5: Dev server ishga tushishini tekshirish**

```bash
cd frontend && pnpm dev -- --port 8443
```

Expected: `http://localhost:8443` da ilova yuklanadi. Xatolar bo'lishi mumkin (import yo'llari hali yangilanmagan) — keyingi tasklarda tuzatiladi.

- [ ] **Step 6: Commit**

```bash
git add frontend/ && git add -u
git commit -m "refactor: move all frontend files into frontend/ directory"
```

---

### Task 3: TypeScript turlarini `frontend/src/types/` ga ajratish

**Files:**
- Create: `frontend/src/types/index.ts`
- Modify: `frontend/src/data/mock.ts` — interfeys ta'riflari o'chiriladi, types importlanadi

**Interfaces:**
- Produces: `frontend/src/types/index.ts` — `Report`, `Badge`, `Status`, `Severity` eksportlari

- [ ] **Step 1: `frontend/src/types/index.ts` yaratish**

```ts
export interface Report {
  id: string
  userId: string
  username: string
  userAvatar: string
  category: string
  categoryIcon: string
  categoryColor: string
  title: string
  description: string
  address: string
  lat: number
  lng: number
  photoColor: string
  photoEmoji: string
  status: 'sent' | 'in_progress' | 'resolved'
  votes: number
  hasVoted: boolean
  createdAt: string
  aiSummary: string
  severity: 'low' | 'medium' | 'high'
  supporterAvatars: string[]
}

export interface Badge {
  id: string
  icon: string
  name: string
  description: string
  earned: boolean
  xpReward: number
  progress?: number
  total?: number
}

export type Status = Report['status']
export type Severity = Report['severity']
```

- [ ] **Step 2: `frontend/src/data/mock.ts` ni yangilash**

Fayl boshidagi `Report` va `Badge` interfeys ta'riflarini o'chirib, import bilan almashtirish. `CATEGORIES`, `SAMPLE_REPORTS`, `BADGES` konstantalar o'zgarmaydi.

`mock.ts` boshiga qo'shish:
```ts
import type { Report, Badge } from '../types'
```

`export interface Report { ... }` va `export interface Badge { ... }` bloklarini o'chirish.

`export type { Report, Badge }` qatorini faylning oxiriga qo'shish (backward compatibility uchun):
```ts
export type { Report, Badge }
```

- [ ] **Step 3: TypeScript tekshirish**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: Xatolar yo'q yoki faqat hali yangilanmagan importlar haqida xatolar.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/ frontend/src/data/mock.ts
git commit -m "refactor: extract TypeScript types to src/types/index.ts"
```

---

### Task 4: Utils va hooks ajratish

**Files:**
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/hooks/useGPS.ts`
- Create: `frontend/src/hooks/useVoiceRecorder.ts`
- Create: `frontend/src/hooks/useVote.ts`
- Modify: `frontend/src/pages/Create.tsx` — `fmtTime`, GPS logikasi, voice recorder logikasi hooks ga o'tkaziladi
- Modify: `frontend/src/pages/Feed.tsx` — vote logikasi `useVote` ga o'tkaziladi

**Interfaces:**
- Consumes: `frontend/src/types/index.ts` — `Report`
- Produces:
  - `useVote(initial: Report[]) → { reports, handleVote }`
  - `useGPS() → { pos, address, locating, handleGPS, setPos, setAddress }`
  - `useVoiceRecorder() → { isRecording, recordingSeconds, description, setDescription, startRecording, stopRecording }`
  - `fmtTime(seconds: number) → string`

- [ ] **Step 1: `frontend/src/lib/utils.ts` yaratish**

```ts
export function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
```

- [ ] **Step 2: `frontend/src/hooks/useVote.ts` yaratish**

```ts
import { useState } from 'react'
import type { Report } from '../types'

export function useVote(initialReports: Report[]) {
  const [reports, setReports] = useState<Report[]>(initialReports)

  const handleVote = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, hasVoted: !r.hasVoted, votes: r.hasVoted ? r.votes - 1 : r.votes + 1 }
          : r
      )
    )
  }

  return { reports, handleVote }
}
```

- [ ] **Step 3: `frontend/src/hooks/useGPS.ts` yaratish**

```ts
import { useState } from 'react'

interface LatLng {
  lat: number
  lng: number
}

export function useGPS(defaultPos: LatLng = { lat: 41.2995, lng: 69.2401 }) {
  const [pos, setPos] = useState<LatLng>(defaultPos)
  const [address, setAddress] = useState('Toshkent sh., Chorsu bozori atrofi')
  const [locating, setLocating] = useState(false)

  const handleGPS = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setPos({ lat, lng })
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return { pos, address, locating, handleGPS, setPos, setAddress }
}
```

- [ ] **Step 4: `frontend/src/hooks/useVoiceRecorder.ts` yaratish**

```ts
import { useState, useRef } from 'react'

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = () => {
    setIsRecording(true)
    setRecordingSeconds(0)
    timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'uz-UZ'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
        onTranscript(transcript)
      }
      recognition.start()
      ;(window as any)._recognition = recognition
    } else {
      setTimeout(() => {
        onTranscript("Ko'chada katta muammo bor, tezda hal qilish kerak. Aholining ko'p qatlamiga ta'sir qilmoqda.")
        stopRecording()
      }, 4000)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const rec = (window as any)._recognition
    if (rec) {
      try {
        rec.stop()
      } catch (_) {}
    }
  }

  return { isRecording, recordingSeconds, startRecording, stopRecording }
}
```

- [ ] **Step 5: `frontend/src/pages/Feed.tsx` ni yangilash — `useVote` ishlatish**

`Feed.tsx` boshidagi importni yangilash:

```ts
import { useVote } from '../hooks/useVote'
import { SAMPLE_REPORTS, CATEGORIES, type Report } from '../data/mock'
```

`useState` va `handleVote` o'rniga hook ishlatish. `const [reports, setReports] = useState<Report[]>(SAMPLE_REPORTS)` va `handleVote` funksiyasini o'chirib:

```ts
const { reports, handleVote } = useVote(SAMPLE_REPORTS)
```

Qolgan mantiq o'zgarmaydi.

- [ ] **Step 6: `frontend/src/pages/Create.tsx` ni yangilash — hooks va utils ishlatish**

Fayl boshiga yangi importlar qo'shish:

```ts
import { useGPS } from '../hooks/useGPS'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { fmtTime } from '../lib/utils'
```

`Create` funksiyasi ichida:

`const [pos, setPos] = useState...`, `const [address, setAddress] = useState...`, `const [locating, setLocating] = useState...`, `handleGPS` funksiyasini o'chirib:
```ts
const { pos, address, locating, handleGPS, setPos, setAddress } = useGPS()
```

`const [isRecording, setIsRecording] = useState...`, `const [recordingSeconds, setRecordingSeconds] = useState...`, `timerRef`, `startRecording`, `stopRecording` funksiyalarini o'chirib:
```ts
const { isRecording, recordingSeconds, startRecording, stopRecording } = useVoiceRecorder(
  (transcript) => setDescription(transcript)
)
```

`fmtTime` funksiya ta'rifini (fayl oxiridagi `const fmtTime = ...`) o'chirish — u endi `../lib/utils` dan import qilinadi.

MapMarker ichidagi `onChange` ni yangilash — `setPos` va `setAddress` endi hook dan keladi, lekin signature o'zgarmaydi.

- [ ] **Step 7: TypeScript tekshirish**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: Xatolar yo'q.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/ frontend/src/hooks/ frontend/src/pages/
git commit -m "refactor: extract hooks (useVote, useGPS, useVoiceRecorder) and lib/utils"
```

---

### Task 5: Mock data ni `@backend` dan import qilish uchun yangilash

**Files:**
- Modify: `frontend/src/data/mock.ts` — `CATEGORIES`, `SAMPLE_REPORTS`, `BADGES` ni `@backend/mock` dan re-export qilish

**Interfaces:**
- Consumes: `backend/mock/reports.ts`, `backend/mock/badges.ts`
- Produces: `frontend/src/data/mock.ts` — barcha eksportlar saqlanadi, ma'lumot endi `backend/` dan keladi

- [ ] **Step 1: `frontend/src/data/mock.ts` ni to'liq almashtirish**

```ts
export type { Report, Badge } from '../types'
export { CATEGORIES, SAMPLE_REPORTS } from '@backend/mock/reports'
export { BADGES } from '@backend/mock/badges'
```

- [ ] **Step 2: TypeScript tekshirish**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: Xatolar yo'q.

- [ ] **Step 3: Dev server da ilovani tekshirish**

```bash
cd frontend && pnpm dev -- --port 8443
```

`http://localhost:8443` ga kirib muammolar ro'yxati ko'rinishini, voting ishlashini, ariza yaratish formasi ishlashini tekshirish.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/data/mock.ts
git commit -m "refactor: mock.ts now re-exports data from @backend/mock"
```

---

### Task 6: Claude strukturasini yaratish va CLAUDE.md larni yangilash

**Files:**
- Create: `claude/CLAUDE.md`
- Create: `claude/AGENTS.md`
- Modify: `CLAUDE.md` (root) — faqat `@claude/CLAUDE.md` qoladi
- Delete: `AGENTS.md` (root) — `claude/AGENTS.md` ga ko'chirildi

**Interfaces:**
- Produces: Claude Code uchun to'liq yo'riqnoma tizimi

- [ ] **Step 1: `claude/AGENTS.md` yaratish**

```md
# figma-make-app

React + Vite + Tailwind CSS v4 loyihasi. **Frontend** papkada joylashgan.

## Development Server

Dev server `frontend/` papkadan ishga tushiriladi:

```bash
cd frontend && pnpm dev
```

Default port: `$PORT` (8443). Figma Make muhitida server avtomatik boshlanadi.

- Preview URL: preview panel orqali
- Hot reload: `frontend/src/` dagi o'zgarishlar avtomatik aks etadi

## Project Structure

```
project-root/
├── frontend/          # React + Vite ilovasi — ASOSIY KOD SHU YERDA
│   ├── src/
│   │   ├── components/    # UI komponentlar
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Yordamchi funksiyalar
│   │   ├── pages/         # Sahifalar (Feed, Create, Profile)
│   │   ├── types/         # TypeScript interfeyslari
│   │   ├── data/mock.ts   # Backend dan re-export (o'zgartirmang)
│   │   ├── App.tsx        # Asosiy komponent
│   │   └── main.tsx       # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Mock data va service shablonlari
│   ├── mock/          # SAMPLE_REPORTS, CATEGORIES, BADGES
│   ├── services/      # API abstraction (hozir mock qaytaradi)
│   └── types/         # Backend TypeScript turlari
└── claude/            # Claude workflow (bu papka)
    ├── CLAUDE.md
    ├── AGENTS.md
    ├── docs/specs/    # Dizayn spesifikatsiyalari
    ├── hooks/         # Claude hooks
    └── skills/        # Custom skills
```

## Key Files

- `frontend/src/App.tsx` — Tab navigatsiya, Framer Motion sahifa o'tishlari
- `frontend/src/pages/Feed.tsx` — Muammolar ro'yxati, filtrlash, voting
- `frontend/src/pages/Create.tsx` — 5 bosqichli ariza (photo → location → description → AI → confirm)
- `frontend/src/pages/Profile.tsx` — XP, nishonlar, liderlar jadvali
- `frontend/src/hooks/useVote.ts` — Ovoz berish holati
- `frontend/src/hooks/useGPS.ts` — GPS joylashuv
- `frontend/src/hooks/useVoiceRecorder.ts` — Ovoz yozish
- `backend/mock/reports.ts` — Asosiy mock ma'lumotlar

## Aliases

- `@` → `frontend/src/`
- `@backend` → `backend/`

## Dependencies

- Runtime: React 19, Framer Motion, Leaflet, Lucide React
- Styling: Tailwind CSS v4
- Build: Vite 8, TypeScript 5.7
- Package manager: pnpm
```

- [ ] **Step 2: `claude/CLAUDE.md` yaratish**

```md
# Mahalla Muammolari — Claude Yo'riqnomasi

Bu loyiha Toshkent fuqarolari uchun mahalla muammolarini bildirishnoma yuborish imkonini beruvchi Telegram Mini App.

## Arxitektura

- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 (`frontend/`)
- **Backend**: Hozircha mock data, kelajakda almashtiriladi (`backend/`)
- **Claude**: Workflow va spesifikatsiyalar (`claude/`)

## Muhim Qoidalar

1. Mock ma'lumotlarni `backend/mock/` da o'zgartiring, `frontend/src/data/mock.ts` ni EMAS
2. Yangi TypeScript turlari `frontend/src/types/index.ts` va `backend/types/index.ts` ga qo'shilsin
3. Yangi logika hook sifatida `frontend/src/hooks/` ga qo'shilsin
4. Dev server faqat `frontend/` papkadan ishga tushadi: `cd frontend && pnpm dev`

## Agent Ko'rsatmalari

@claude/AGENTS.md
```

- [ ] **Step 3: Root `CLAUDE.md` ni yangilash**

```
@claude/CLAUDE.md
```

- [ ] **Step 4: Root `AGENTS.md` ni o'chirish**

```bash
rm AGENTS.md
```

- [ ] **Step 5: Commit**

```bash
git add claude/CLAUDE.md claude/AGENTS.md CLAUDE.md
git rm AGENTS.md
git commit -m "docs: setup claude/ workflow structure, update CLAUDE.md"
```

---

### Task 7: Keraksiz fayllarni tozalash va yakuniy tekshirish

**Files:**
- Delete: `frontend/src/imports/Mahalla_Fix_TZ.pdf` — kod bilan bog'liq emas, `claude/docs/` ga ko'chirilishi mumkin
- Verify: barcha import yo'llari ishlaydi
- Verify: TypeScript xatosiz compile bo'ladi
- Verify: Ilova brauzerda to'g'ri ishlaydi

**Interfaces:**
- Produces: toza, to'liq ishlaydigan loyiha

- [ ] **Step 1: PDF faylni ko'chirish**

```bash
mkdir -p claude/docs/references
mv frontend/src/imports/Mahalla_Fix_TZ.pdf claude/docs/references/
rmdir frontend/src/imports
```

- [ ] **Step 2: To'liq TypeScript tekshirish**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 0 xato.

- [ ] **Step 3: Dev server ishga tushirish va asosiy funksiyalarni tekshirish**

```bash
cd frontend && pnpm dev -- --port 8443
```

Brauzerda `http://localhost:8443` da tekshirish:
- Feed sahifasi yuklanadi, muammolar ko'rinadi
- Kategoriya filtri ishlaydi
- Ovoz berish tugmasi (`+1`) ishlaydi
- `+` tugmasi → Create sahifasi ochiladi, barcha 5 bosqich ishlaydi
- Profile sahifasi — XP, nishonlar, liderlar jadvali ko'rinadi

- [ ] **Step 4: Yakuniy papka tuzilmasini tekshirish**

```bash
find . -type f -not -path './.git/*' -not -path './frontend/node_modules/*' | sort
```

Expected tuzilma:
```
./CLAUDE.md
./backend/mock/badges.ts
./backend/mock/reports.ts
./backend/README.md
./backend/services/badges.service.ts
./backend/services/reports.service.ts
./backend/types/index.ts
./claude/AGENTS.md
./claude/CLAUDE.md
./claude/docs/references/Mahalla_Fix_TZ.pdf
./claude/docs/specs/2026-07-24-project-restructure-design.md
./claude/hooks/README.md
./claude/skills/README.md
./frontend/index.html
./frontend/package.json
./frontend/pnpm-lock.yaml
./frontend/src/App.tsx
./frontend/src/components/BottomNav.tsx
./frontend/src/components/Header.tsx
./frontend/src/components/MapPicker.tsx
./frontend/src/components/MyTickets.tsx
./frontend/src/components/ReportCard.tsx
./frontend/src/data/mock.ts
./frontend/src/hooks/useGPS.ts
./frontend/src/hooks/useVote.ts
./frontend/src/hooks/useVoiceRecorder.ts
./frontend/src/index.css
./frontend/src/lib/utils.ts
./frontend/src/main.tsx
./frontend/src/pages/Create.tsx
./frontend/src/pages/Feed.tsx
./frontend/src/pages/Profile.tsx
./frontend/src/types/index.ts
./frontend/src/vite-env.d.ts
./frontend/tsconfig.json
./frontend/vite.config.ts
```

- [ ] **Step 5: Yakuniy commit**

```bash
git add -A
git commit -m "chore: final cleanup — move PDF to claude/docs, verify all imports"
```
