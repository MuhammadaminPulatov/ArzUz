# S4: Profile — Streak va XP sistema

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Profile sahifasidagi streak (0 hardcoded) va "sarflangan XP" (320 hardcoded) ni real ma'lumotlarga ulash; XP ticket yaratganda va hal etilganda avtomatik qo'shilsin.

**Architecture:** User modeliga `streak` va `spentXp` fieldlari qo'shiladi. Ticket yaratilganda `+150 XP`, hal etilganda `+300 XP` qo'shiladi. Kundalik login XP (`+50`) — foydalanuvchi har kun birinchi marta `/auth/me` ga murojaat qilganda avtomatik beriladi. `/auth/me` endpointida `streak` va `spentXp` qaytariladi.

**Tech Stack:** React 19, TypeScript, Express, MongoDB/Mongoose

## Global Constraints

- Frontend: `frontend/src/` ichida
- Backend: `server/src/` ichida
- Barcha matnlar O'zbekcha
- API javoblar `{ ok: boolean; data: T }` formatida
- Commit har bir task oxirida

---

### Task 1: User modeliga streak va spentXp qo'shish

**Files:**
- Modify: `server/src/models/user.model.ts`

**Interfaces:**
- Produces: `UserDoc.streak: number`, `UserDoc.spentXp: number`, `UserDoc.lastStreakDate: Date | null`

- [ ] **Step 1: user.model.ts interface yangilash**

`server/src/models/user.model.ts` da `UserDoc` interface-ga qo'shing:
```ts
streak: number
spentXp: number
lastStreakDate?: Date
```

- [ ] **Step 2: Schema yangilash**

`userSchema` da (badges qatoridan keyin) qo'shing:
```ts
streak:         { type: Number, default: 0 },
spentXp:        { type: Number, default: 0 },
lastStreakDate:  { type: Date, default: null },
```

- [ ] **Step 3: Build tekshirish**

```bash
cd server && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 4: Commit**

```bash
git add server/src/models/user.model.ts
git commit -m "feat: add streak, spentXp, lastStreakDate to User model"
```

---

### Task 2: XP berilishi — ticket yaratish va hal etish

**Files:**
- Modify: `server/src/routes/tickets.ts`

**Interfaces:**
- Consumes: Ticket yaratilganda user xp `+150` bo'lishi; resolved status PATCH da user xp `+300` va user.resolvedCount `+1` bo'lishi

- [ ] **Step 1: tickets.ts ni o'qish**

`server/src/routes/tickets.ts` faylini ko'ring. `POST /api/tickets` handleri va PATCH `/api/tickets/:id/vote` handleri bor.

- [ ] **Step 2: POST /api/tickets da XP berish**

`server/src/routes/tickets.ts` da `POST /api/tickets` handler ichiga Ticket saqlanganidan so'ng qo'shing:

Import qo'shing (fayl boshiga):
```ts
import { User } from '../models/user.model'
```

Ticket saqlanganidan keyin:
```ts
// XP: +150 for new ticket
await User.findOneAndUpdate(
  { telegramId: (req as Request & { user: { telegramId: string } }).user.telegramId },
  { $inc: { xp: 150, reportCount: 1 } },
)
```

- [ ] **Step 3: admin PATCH tickets/:id da resolved XP berish**

`server/src/routes/admin.ts` da `PATCH /api/admin/tickets/:id` handler ichiga, `ticket` topilgandan keyin:

Import qo'shing:
```ts
import { User } from '../models/user.model'
```

Status `resolved` bo'lganda (mavjud `if (update['status'])` blokidan keyin):
```ts
if (update['status'] === 'resolved' && ticket) {
  await User.findOneAndUpdate(
    { telegramId: ticket.userId },
    { $inc: { xp: 300, resolvedCount: 1 } },
  )
}
```

- [ ] **Step 4: Build tekshirish**

```bash
cd server && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/tickets.ts server/src/routes/admin.ts
git commit -m "feat: award XP — +150 on ticket create, +300 on resolve"
```

---

### Task 3: Kundalik streak va /auth/me yangilash

**Files:**
- Modify: `server/src/routes/auth.ts`

**Interfaces:**
- Produces: `/auth/me` response da `streak: number`, `spentXp: number` fieldlari

- [ ] **Step 1: /auth/me da streak logikasi**

`server/src/routes/auth.ts` da `GET /api/auth/me` handler ichini yangilang. User topilganidan keyin streak check:

```ts
authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const telegramId = (req as Request & { user: { telegramId: string } }).user!.telegramId
  let user = await User.findOne({ telegramId }).lean()
  if (!user) {
    res.status(404).json({ ok: false, error: 'User not found' })
    return
  }

  // Streak: agar bugun kirilmagan bo'lsa
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null
  if (lastDate) lastDate.setHours(0, 0, 0, 0)

  const isFirstToday = !lastDate || lastDate.getTime() < today.getTime()
  if (isFirstToday) {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const isConsecutive = lastDate && lastDate.getTime() === yesterday.getTime()

    await User.findOneAndUpdate(
      { telegramId },
      {
        $inc: {
          xp:     50,
          streak: isConsecutive ? 1 : 0,
        },
        $set: {
          streak:        isConsecutive ? (user.streak ?? 0) + 1 : 1,
          lastStreakDate: new Date(),
          lastActiveAt:  new Date(),
        },
      },
    )
    user = await User.findOne({ telegramId }).lean()
  }

  const tickets = await Ticket.find({ userId: telegramId })
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({
    ok: true,
    data: {
      ...user,
      isAdmin: (req as Request & { user: { isAdmin: boolean } }).user!.isAdmin,
      tickets,
    },
  })
})
```

- [ ] **Step 2: Build tekshirish**

```bash
cd server && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/auth.ts
git commit -m "feat: daily streak +50 XP on first /auth/me each day"
```

---

### Task 4: Frontend — Profile streak va spentXp ko'rsatish

**Files:**
- Modify: `frontend/src/pages/Profile.tsx`

**Interfaces:**
- Consumes: `/auth/me` da endi `streak: number`, `spentXp: number` mavjud

- [ ] **Step 1: Profile.tsx ga streak state qo'shish**

`frontend/src/pages/Profile.tsx` da state'lar ichiga qo'shing:
```tsx
const [streak,   setStreak]   = useState(0)
const [spentXp,  setSpentXp]  = useState(0)
```

`api.get('/auth/me')` then() ichiga:
```tsx
setStreak(u.streak ?? 0)
setSpentXp(u.spentXp ?? 0)
```

- [ ] **Step 2: Stat cards ichida streak ni real qilish**

Profile.tsx da stat cards arrayida (Flame iconli card):
```tsx
{ Icon: Flame, value: streak, label: 'Streak', gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)', shadow: 'rgba(245,158,11,0.2)' },
```

- [ ] **Step 3: Rewards tab da spentXp real qilish**

Rewards tab da hardcoded `320 XP` o'rniga `{spentXp}`:
```tsx
<p className="text-[16px] font-black text-white">{spentXp} XP</p>
```

Va progress bar:
```tsx
const totalXp = xp + spentXp
<div className="h-full rounded-full w-[{totalXp > 0 ? Math.round((spentXp / totalXp) * 100) : 0}%]" style={{ background: '#FCD34D' }} />
```

To'g'riroq: inline style bilan:
```tsx
<div className="h-full rounded-full" style={{ width: `${totalXp > 0 ? Math.round((spentXp / totalXp) * 100) : 0}%`, background: '#FCD34D' }} />
```

`totalXp` ni JSX tashqarida hisoblang:
```tsx
const totalXp = xp + spentXp
```

- [ ] **Step 4: Build tekshirish**

```bash
cd frontend && pnpm build 2>&1 | grep -i error
```

Expected: 0 xato

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Profile.tsx
git commit -m "feat: Profile shows real streak and spentXp from API"
```
