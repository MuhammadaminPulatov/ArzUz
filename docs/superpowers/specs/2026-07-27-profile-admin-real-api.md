# Profile & Admin — Real API Wiring Design

**Date:** 2026-07-27
**Status:** Approved

---

## Goal

Wire `Profile.tsx` and `Admin.tsx` to the real MongoDB backend. Remove all mock fallbacks and static leaderboard data. Add a `/api/leaderboard` endpoint and fix the missing `isAdmin` field in `/api/auth/me`.

---

## Context

Both pages already have API calls in place. The gaps are:

- `/api/auth/me` does not return `isAdmin` — Profile always shows no admin button
- Leaderboard is 5 hardcoded Uzbek names — no real data
- Both pages fall back to `MOCK_PROFILE` / `MOCK_ANALYTICS` / `SAMPLE_REPORTS` silently on any error
- Both pages subscribe to `onLocalReport` (mock-mode event bus) — dead code in production

---

## Architecture

No new services or models needed. All data is already in MongoDB (`User`, `Ticket` collections). Two backend route changes + two frontend page updates.

**Tech Stack:** Express 4 + Mongoose + React 19 + existing `api.ts` client

---

## Backend Changes

### 1. Fix `/api/auth/me` — add `isAdmin`

**File:** `server/src/routes/auth.ts`

Current response (line ~109):
```typescript
res.json({ ok: true, data: { ...user, tickets } })
```

Fixed response:
```typescript
res.json({ ok: true, data: { ...user, isAdmin: (req as any).user!.isAdmin, tickets } })
```

The `isAdmin` flag lives in the JWT payload (`(req as any).user.isAdmin`), not in the MongoDB `User` document. Without this line, Profile always receives `isAdmin: undefined` and never shows the Admin button.

---

### 2. New `GET /api/leaderboard`

**File:** `server/src/routes/auth.ts` (added after `/me`)

- **Auth:** None (public endpoint)
- **Query param:** `limit` (default 10, max 50)
- **Returns:**
```typescript
{
  ok: true,
  data: Array<{
    rank: number          // 1-based position
    telegramId: string
    firstName: string
    username: string
    xp: number
    reportCount: number
    badges: string[]
  }>
}
```
- **Query:** `User.find().sort({ xp: -1 }).limit(limit).select('telegramId firstName username xp reportCount badges')`

---

## Frontend Changes

### Profile.tsx

**Imports removed:**
- `MOCK_PROFILE` from `../data/mock`
- `onLocalReport` from `../lib/localEvents`

**State added:**
```typescript
const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
const [reportCount, setReportCount] = useState(0)
const [resolvedCount, setResolvedCount] = useState(0)
const [level, setLevel] = useState(1)
const [badges, setBadges] = useState<string[]>([])
const [myTelegramId, setMyTelegramId] = useState('')
```

**Interface added:**
```typescript
interface LeaderboardEntry {
  rank: number
  telegramId: string
  firstName: string
  username: string
  xp: number
  reportCount: number
  badges: string[]
}
```

**`/auth/me` effect** — populate all fields from real data:
```typescript
api.get<{
  telegramId: string; firstName: string; xp: number; level: number;
  isAdmin: boolean; reportCount: number; resolvedCount: number;
  badges: string[]; tickets: Report[]
}>('/auth/me').then((u) => {
  setMyTelegramId(u.telegramId)
  setFirstName(u.firstName)
  setXp(u.xp)
  setLevel(u.level)
  setIsAdmin(u.isAdmin)
  setReportCount(u.reportCount)
  setResolvedCount(u.resolvedCount)
  setBadges(u.badges)
  setMyReports(u.tickets)
}).catch(() => {
  // show empty state — no mock fallback
})
```

**Leaderboard fetch** — separate effect:
```typescript
useEffect(() => {
  api.get<LeaderboardEntry[]>('/leaderboard').then(setLeaderboard).catch(() => {})
}, [])
```

**Leaderboard render** — replace static `LEADERBOARD.map(...)` with `leaderboard.map(entry => ...)`:
- `avatar` = `entry.firstName[0].toUpperCase()`
- `title` = `getTitle(entry.xp).label`
- `isMe` = `entry.telegramId === myTelegramId`
- `color`/`glow` — derived from rank: rank 1 → gold, rank 2 → silver, rank 3 → bronze, rank 4+ → blue
- `badge` — rank 1 → `Crown` icon, rank 2–3 → `Trophy` icon, 4+ → `Star` icon (Lucide, no emoji)

**Badges tab** — map `badges` (string array of badge IDs) through the `BADGES` catalog from `../data/mock` to get label/icon. Badge IDs that don't exist in the catalog are skipped.

**`onLocalReport` subscription** — removed entirely.

**Error handling** — on `/auth/me` failure, show empty state (name = Telegram display name from `getTelegramUserName()`, xp = 0, empty lists). No crash, no mock data.

---

### Admin.tsx

**Imports removed:**
- `MOCK_ANALYTICS` from `../data/mock`
- `SAMPLE_REPORTS` from `../data/mock`
- `onLocalReport` from `../lib/localEvents`

**`/admin/analytics` + `/admin/tickets` effect** — on error, set empty state:
```typescript
Promise.all([
  api.get<AdminAnalytics>('/admin/analytics').catch(() => null),
  api.get<{ tickets: Report[]; total: number }>('/admin/tickets').catch(() => null),
]).then(([aData, rData]) => {
  setAnalytics(aData ?? { total: 0, byStatus: {}, avgResolutionDays: 0 })
  setReports(rData?.tickets ?? [])
  setLoading(false)
})
```

**Refresh button** — same pattern, no mock fallback.

**`onLocalReport` subscription** — removed entirely.

**Empty state UI** — when `reports` is empty after loading, show: "Hozircha arizalar yo'q" centered text. No fake data.

---

## API Response Shape Compatibility

| Frontend reads | Server sends | Match? |
|---|---|---|
| `u.isAdmin` from `/auth/me` | `{ ...user, isAdmin, tickets }` | After fix: yes |
| `u.telegramId` from `/auth/me` | DB user doc has `telegramId` | Yes |
| `u.badges` from `/auth/me` | DB user doc has `badges: string[]` | Yes |
| `leaderboard[]` from `/leaderboard` | New endpoint, see above | Yes |
| `aData.byStatus` from `/admin/analytics` | `{ total, byStatus, avgResolutionDays }` | Yes |
| `rData.tickets` from `/admin/tickets` | `{ tickets, total, page, limit }` | Yes |
| `ticket.title` from ticket list | `toJSON` virtual adds `title` field | Yes |

---

## What Stays Static (no backend)

- `REWARDS` catalog — UzCard bonus, Premium oy, etc. — UI-only, no backend
- `TITLES` XP thresholds — client-side constants
- `BADGES` catalog (labels/icons) — imported from `../data/mock`; only the *user's badge IDs* come from the server
- Rank colors and glows — computed from rank number client-side

---

## Files Changed

| File | Change |
|---|---|
| `server/src/routes/auth.ts` | Add `isAdmin` to `/me` response; add `GET /leaderboard` route |
| `frontend/src/pages/Profile.tsx` | Remove mocks, add leaderboard + stats from API |
| `frontend/src/pages/Admin.tsx` | Remove mocks, replace fallbacks with empty state |

---

## Out of Scope

- Pagination for admin tickets list (already has `limit=50` default, sufficient for now)
- Leaderboard pagination
- Real reward redemption backend
- Admin user management (ban/promote)
