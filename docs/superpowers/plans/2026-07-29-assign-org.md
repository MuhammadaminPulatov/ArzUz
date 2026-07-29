# Tashkilotga Yo'naltirish (Assign to Organization) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AdminReports'dagi disabled "Tashkilotga yo'naltirish" tugmasini ishga tushirish — tashkilot tanlash modal, assign state va karta da ko'rsatish.

**Architecture:** `AssignOrgModal` yangi komponent sifatida yaratiladi (`frontend/src/components/admin/`). `AdminReports` ichida `assignedOrgs` state saqlanadi (`Record<string, MockOrganization>`). Assign bo'lganda status avtomatik `in_progress` ga o'tadi. Backend API yo'q — faqat mock state (lokal).

**Tech Stack:** React 19, Framer Motion (mavjud), Lucide React (mavjud), `@backend` alias. Yangi package yo'q.

## Global Constraints

- Yangi npm package qo'shilmaydi — faqat mavjud kutubxonalar
- Tailwind v4 — `@apply` ishlatilmaydi, inline style + className kombinatsiyasi
- `@backend` alias ishlaydi: `'@backend': path.resolve(__dirname, '../backend')`
- Barcha UI matnlari o'zbekcha
- Ranglar: `#0F172A` (text), `#3B82F6` (blue), `#10B981` (green), `#94A3B8` (muted), `#F8FAFC` (bg)
- Build tekshiruvi: `cd frontend && pnpm build` — xato bo'lmasligi shart
- `noUnusedLocals: true` — import qilingan har bir o'zgaruvchi ishlatilishi shart

---

### Task 1: AssignOrgModal komponenti

**Files:**
- Create: `frontend/src/components/admin/AssignOrgModal.tsx`

**Interfaces:**
- Consumes: `MOCK_ORGANIZATIONS`, `MockOrganization` from `@backend/mock/organizations`
- Produces: `default export AssignOrgModal` — Task 2 da import qilinadi

- [ ] **Step 1: Faylni yarating**

```typescript
// frontend/src/components/admin/AssignOrgModal.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { MOCK_ORGANIZATIONS, type MockOrganization } from '@backend/mock/organizations'

interface Props {
  reportCategory: string
  open: boolean
  onClose: () => void
  onAssign: (org: MockOrganization) => void
}

export default function AssignOrgModal({ reportCategory, open, onClose, onAssign }: Props) {
  const [search, setSearch] = useState('')

  const filtered = MOCK_ORGANIZATIONS.filter(org => {
    const q = search.toLowerCase()
    return !q || org.name.toLowerCase().includes(q) || org.category.toLowerCase().includes(q)
  })

  const sorted = [
    ...filtered.filter(org => org.category === reportCategory),
    ...filtered.filter(org => org.category !== reportCategory),
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(15,23,42,0.5)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl flex flex-col"
            style={{ background: '#fff', maxHeight: '80vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: '#E2E8F0' }} />
            </div>

            {/* Header */}
            <div className="px-4 pt-2 pb-3 flex items-center justify-between shrink-0"
              style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
              <div>
                <p className="text-[15px] font-black" style={{ color: '#0F172A' }}>Tashkilot tanlash</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Arizani yo'naltirish uchun tashkilotni tanlang</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(241,245,249,0.8)' }}>
                <X size={16} style={{ color: '#64748B' }} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  autoFocus
                  type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tashkilot qidirish..."
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[12.5px] outline-none"
                  style={{ background: '#F8FAFC', border: '1px solid rgba(226,232,240,0.8)', color: '#0F172A' }}
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto px-4 pb-8 flex-1">
              {sorted.length === 0 && (
                <p className="text-center py-10 text-[13px]" style={{ color: '#94A3B8' }}>Tashkilot topilmadi</p>
              )}
              {sorted.map((org, i) => {
                const isMatch = org.category === reportCategory
                return (
                  <motion.button
                    key={org.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onAssign(org); onClose() }}
                    className="w-full flex items-center gap-3 py-3 text-left"
                    style={{ borderBottom: '1px solid rgba(226,232,240,0.5)' }}
                  >
                    <span className="text-xl w-9 text-center shrink-0">{org.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold truncate" style={{ color: '#0F172A' }}>{org.name}</p>
                        {isMatch && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>Mos</span>
                        )}
                      </div>
                      <p className="text-[10.5px]" style={{ color: '#94A3B8' }}>{org.district} · {org.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-black" style={{ color: '#3B82F6' }}>{org.totalAssigned}</p>
                      <p className="text-[9.5px]" style={{ color: '#94A3B8' }}>ariza</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Build tekshiruvi**

```bash
cd frontend && pnpm build
```

Natija: `dist/` yaratildi, xato yo'q.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/admin/AssignOrgModal.tsx
git commit -m "feat: add AssignOrgModal — org selection bottom sheet"
```

---

### Task 2: AdminReports ni ulash

**Files:**
- Modify: `frontend/src/components/admin/AdminReports.tsx`

**Interfaces:**
- Consumes: `AssignOrgModal` (Task 1), `MockOrganization` from `@backend/mock/organizations`
- The `Props` interface, state structure, and `onStatusChange` signature don't change

Quyidagi o'zgarishlar kerak:

**1. Importlar (mavjud import satrlari boshiga qo'shiladi):**

```typescript
import AssignOrgModal from './AssignOrgModal'
import { type MockOrganization } from '@backend/mock/organizations'
```

**2. Yangi state (`page` state dan keyin):**

```typescript
const [assignedOrgs,   setAssignedOrgs]   = useState<Record<string, MockOrganization>>({})
const [assigningReport, setAssigningReport] = useState<{ id: string; category: string } | null>(null)
```

**3. Handler (`filtered` useMemo dan keyin):**

```typescript
const handleAssign = (org: MockOrganization) => {
  if (!assigningReport) return
  setAssignedOrgs(prev => ({ ...prev, [assigningReport.id]: org }))
  onStatusChange(assigningReport.id, 'in_progress')
  setAssigningReport(null)
}
```

**4. Karta oxiridagi disabled button (134–140 qator) ni almashtirish:**

Eski kod:
```typescript
<button disabled
  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
  style={{ background: 'rgba(241,245,249,0.5)', color: '#CBD5E1', border: '1px dashed #E2E8F0', cursor: 'not-allowed' }}
  title="Sub-loyiha 2 da faollashadi">
  <Building2 size={12} />
  Tashkilotga yo'naltirish
</button>
```

Yangi kod:
```typescript
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
```

**5. `AssignOrgModal` ni JSX oxirida (closing `</div>` dan oldin) qo'shish:**

```typescript
      <AssignOrgModal
        reportCategory={assigningReport?.category ?? ''}
        open={assigningReport !== null}
        onClose={() => setAssigningReport(null)}
        onAssign={handleAssign}
      />
    </div>
  )
}
```

- [ ] **Step 1: Importlarni qo'shish**

`frontend/src/components/admin/AdminReports.tsx` 1-2 qatordagi mavjud importlar bilan bir qatorda qo'shing:

```typescript
import AssignOrgModal from './AssignOrgModal'
import { type MockOrganization } from '@backend/mock/organizations'
```

- [ ] **Step 2: Yangi state va handler qo'shish**

`const [page, setPage] = useState(1)` dan keyin:

```typescript
const [assignedOrgs,    setAssignedOrgs]   = useState<Record<string, MockOrganization>>({})
const [assigningReport, setAssigningReport] = useState<{ id: string; category: string } | null>(null)
```

`const paginated = filtered.slice(...)` dan keyin:

```typescript
const handleAssign = (org: MockOrganization) => {
  if (!assigningReport) return
  setAssignedOrgs(prev => ({ ...prev, [assigningReport.id]: org }))
  onStatusChange(assigningReport.id, 'in_progress')
  setAssigningReport(null)
}
```

- [ ] **Step 3: Disabled buttoni almashtirish**

Quyidagi blokni toping (134–140 qatorlar):

```typescript
              <button disabled
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
                style={{ background: 'rgba(241,245,249,0.5)', color: '#CBD5E1', border: '1px dashed #E2E8F0', cursor: 'not-allowed' }}
                title="Sub-loyiha 2 da faollashadi">
                <Building2 size={12} />
                Tashkilotga yo'naltirish
              </button>
```

Almashtiring:

```typescript
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
```

- [ ] **Step 4: AssignOrgModal ni JSX ga qo'shish**

Oxirgi `</div>` (komponenet return ning yopiluvchi tag) dan oldin:

```typescript
      <AssignOrgModal
        reportCategory={assigningReport?.category ?? ''}
        open={assigningReport !== null}
        onClose={() => setAssigningReport(null)}
        onAssign={handleAssign}
      />
```

- [ ] **Step 5: Build tekshiruvi**

```bash
cd frontend && pnpm build
```

Natija: xato yo'q.

- [ ] **Step 6: Dev serverda qo'lda tekshirish**

```bash
cd frontend && pnpm dev
```

Browser: `http://localhost:5174/?admin=1` → Arizalar seksiyasiga o'ting.

Tekshirish:
- Har bir karta pastida "Tashkilotga yo'naltirish" tugmasi ko'rinadi (enabled, kulrang)
- Tugmani bosing → bottom sheet modal ochiladi
- Tashkilot nomini qidirib topiladi
- Kategoriyaga mos tashkilotlar "Mos" badge bilan ko'rinadi
- Tashkilot tanlanadi → modal yopiladi, karta pastida `[icon] [shortName] ga yo'naltirildi` ko'rinadi (ko'k rang)
- Status avtomatik "Jarayonda"ga o'tadi
- Backdrop (qoraytirilgan fon) bosib modal yopiladi

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/admin/AdminReports.tsx
git commit -m "feat: enable assign-to-org flow in AdminReports"
```

---

## Self-Review

**Spec coverage:**
- ✅ "Yo'naltirish" tugmasi faollashtirildi
- ✅ Tashkilot tanlash modal (AssignOrgModal)
- ✅ Kategoriyaga mos tashkilotlar birinchi ko'rinadi ("Mos" badge)
- ✅ Assign bo'lganda status `in_progress` ga o'tadi
- ✅ Karta da assigned org ko'rsatiladi
- ✅ Search filtering (nom va kategoriya bo'yicha)
- ✅ Backend API yo'q — faqat lokal state

**Placeholder scan:** Yo'q — barcha qadamlar to'liq kod bilan.

**Type consistency:** `MockOrganization` ikkala taskda ham `@backend/mock/organizations` dan import qilinadi — mos.
