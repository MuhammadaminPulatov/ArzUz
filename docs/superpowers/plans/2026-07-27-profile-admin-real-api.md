# Profile & Admin — Real API Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Profile.tsx and Admin.tsx to the real MongoDB backend — remove all mock fallbacks, add `/api/leaderboard`, fix the missing `isAdmin` bug in `/api/auth/me`.

**Architecture:** Three targeted changes in sequence: (1) backend adds `isAdmin` to `/auth/me` response and a new public `/leaderboard` route; (2) Profile.tsx fetches real user stats, badges, and leaderboard — removes static data; (3) Admin.tsx removes mock fallbacks. Deploy to Vercel after all three tasks.

**Tech Stack:** Express 4 + Mongoose + React 19 + TypeScript + existing `api.ts` client + Vercel

## Global Constraints

- No new packages — use existing `mongoose`, `express`, `api.ts` client
- No emojis in code comments or UI strings (except BADGES catalog which already has them)
- All UI copy stays in Uzbek
- `(req as any).user` pattern everywhere Express types are needed (Vercel compiler limitation)
- Backend lives in `server/`, frontend in `frontend/`
- Deploy commands: `cd server && vercel --prod` and `cd frontend && vercel --prod`

---

## File Map

| File | What changes |
|---|---|
| `server/src/routes/auth.ts` | Add `isAdmin` to `/me` response (line 109); add `GET /leaderboard` route |
| `frontend/src/pages/Profile.tsx` | Remove mock imports/fallbacks; add 6 new state vars; fix 8 hardcoded values; wire leaderboard |
| `frontend/src/pages/Admin.tsx` | Remove 3 mock imports; replace 2 mock fallbacks with empty state; remove `onLocalReport` |

---

## Task 1: Backend — fix `/auth/me` + add `/api/leaderboard`

**Files:**
- Modify: `server/src/routes/auth.ts:109` (1-line fix)
- Modify: `server/src/routes/auth.ts:111` (add leaderboard route after `/me`)

**Interfaces:**
- Produces: `GET /api/leaderboard` → `{ ok: true, data: LeaderboardEntry[] }` where `LeaderboardEntry = { rank, telegramId, firstName, username, xp, reportCount, badges }`
- Produces: `GET /api/auth/me` now includes `isAdmin: boolean` in its response

- [ ] **Step 1: Fix `/auth/me` — add `isAdmin` to response**

In `server/src/routes/auth.ts`, line 109, change:

```typescript
  res.json({ ok: true, data: { ...user, tickets } })
```

to:

```typescript
  res.json({ ok: true, data: { ...user, isAdmin: (req as any).user!.isAdmin, tickets } })
```

- [ ] **Step 2: Add `/api/leaderboard` route**

In `server/src/routes/auth.ts`, add this after the `/me` route (after line 110):

```typescript
// GET /api/leaderboard — public, no auth required
authRouter.get('/leaderboard', async (req: Request, res: Response) => {
  const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '10'), 10))
  const users = await User.find()
    .sort({ xp: -1 })
    .limit(limit)
    .select('telegramId firstName username xp reportCount badges')
    .lean()

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    telegramId: u.telegramId,
    firstName: u.firstName,
    username: u.username,
    xp: u.xp,
    reportCount: u.reportCount,
    badges: u.badges,
  }))

  res.json({ ok: true, data: leaderboard })
})
```

- [ ] **Step 3: Verify locally with curl**

```bash
# Start server locally (or test against production after deploy)
# Test /leaderboard
curl -s http://localhost:3001/api/leaderboard | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)"
# Expected: {"ok":true,"data":[{"rank":1,"telegramId":"...","firstName":"...","xp":0,...}]}

# Test /auth/me includes isAdmin
TOKEN="<your-jwt-token>"
curl -s http://localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('isAdmin:', d['data'].get('isAdmin'))"
# Expected: isAdmin: True
```

- [ ] **Step 4: Commit**

```bash
cd server
git add src/routes/auth.ts
git commit -m "feat: add isAdmin to /auth/me response and add GET /leaderboard route"
```

---

## Task 2: Update Profile.tsx — real user data + real leaderboard

**Files:**
- Modify: `frontend/src/pages/Profile.tsx` (multiple targeted edits)

**Interfaces:**
- Consumes from Task 1: `GET /api/auth/me` returns `{ telegramId, firstName, xp, level, isAdmin, reportCount, resolvedCount, badges: string[], tickets: Report[] }`
- Consumes from Task 1: `GET /api/leaderboard` returns `Array<{ rank, telegramId, firstName, username, xp, reportCount, badges }>`

- [ ] **Step 1: Fix imports — remove mock, add `getTelegramUsername`**

Change line 8–11 from:

```typescript
import { BADGES, MOCK_PROFILE } from '../data/mock'
import { api } from '../lib/api'
import { onLocalReport } from '../lib/localEvents'
import { getTelegramUserName } from '../hooks/useAuth'
```

to:

```typescript
import { BADGES } from '../data/mock'
import { api } from '../lib/api'
import { getTelegramUserName, getTelegramUsername } from '../hooks/useAuth'
```

- [ ] **Step 2: Remove static LEADERBOARD and TANIQLI_USERS constants**

Delete lines 41–50 (the `const LEADERBOARD = [...]` array and `const TANIQLI_USERS = [...]`):

```typescript
// DELETE these lines entirely:
const LEADERBOARD = [
  { rank: 1, name: 'Sardor T.',   ... },
  { rank: 2, name: 'Malika R.',   ... },
  { rank: 3, name: 'Jahongir K.', ... },
  { rank: 4, name: 'Aziz S.',     ..., isMe: true },
  { rank: 5, name: 'Nodira A.',   ... },
]

// Premium "Taniqli" users (admin-assignable)
const TANIQLI_USERS = ['Sardor T.', 'UzMedia_Blog']
```

- [ ] **Step 3: Add `LeaderboardEntry` interface (after the `type Tab` line, ~line 67)**

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

- [ ] **Step 4: Add new state variables (inside the component, after existing state declarations ~line 76)**

Change the existing state block from:

```typescript
  const [activeTab, setActiveTab] = useState<Tab>('reports')
  const [myReports, setMyReports] = useState<Report[]>([])
  const [firstName, setFirstName] = useState(getTelegramUserName())
  const [xp, setXp] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
```

to:

```typescript
  const [activeTab, setActiveTab] = useState<Tab>('reports')
  const [myReports, setMyReports] = useState<Report[]>([])
  const [firstName, setFirstName] = useState(getTelegramUserName())
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reportCount, setReportCount] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [totalVotes, setTotalVotes] = useState(0)
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([])
  const [myTelegramId, setMyTelegramId] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
```

- [ ] **Step 5: Replace both `useEffect` blocks — `/auth/me` + remove `onLocalReport`**

Replace lines 78–101:

```typescript
  useEffect(() => {
    api.get<{
      telegramId: string; firstName: string; xp: number; level: number;
      isAdmin: boolean; reportCount: number; resolvedCount: number;
      badges: string[]; tickets: Report[]
    }>('/auth/me')
      .then((u) => {
        setMyTelegramId(u.telegramId)
        setFirstName(u.firstName)
        setXp(u.xp)
        setLevel(u.level)
        setIsAdmin(u.isAdmin ?? false)
        setReportCount(u.reportCount)
        setResolvedCount(u.resolvedCount)
        setEarnedBadgeIds(u.badges ?? [])
        setMyReports(u.tickets ?? [])
        setTotalVotes((u.tickets ?? []).reduce((sum, t) => sum + (t.votes ?? 0), 0))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get<LeaderboardEntry[]>('/leaderboard').then(setLeaderboard).catch(() => {})
  }, [])
```

- [ ] **Step 6: Fix derived values (lines 103–106) — use `earnedBadgeIds`**

Change:

```typescript
  const earnedBadges = BADGES.filter((b) => b.earned).length
```

to:

```typescript
  const earnedBadges = earnedBadgeIds.length
```

- [ ] **Step 7: Fix hardcoded values in the render**

**7a. Level display** — find `<span className="text-[22px] font-black text-white">4</span>` (around line 196) and change to:

```tsx
<span className="text-[22px] font-black text-white">{level}</span>
```

**7b. Username display** — find `<p className="text-[11px] text-blue-200 mt-1">@aziz_toshkent</p>` (around line 173) and change to:

```tsx
<p className="text-[11px] text-blue-200 mt-1">
  {getTelegramUsername() ? `@${getTelegramUsername()}` : '—'}
</p>
```

**7c. Stat cards** — find the stat cards array (around line 236) and replace hardcoded values:

```tsx
        {[
          { Icon: FileText,     value: reportCount,   label: 'Ariza',      gradient: 'linear-gradient(135deg,#3B82F6,#6366F1)', shadow: 'rgba(99,102,241,0.2)' },
          { Icon: CheckCircle2, value: resolvedCount,  label: 'Hal etildi', gradient: 'linear-gradient(135deg,#10B981,#059669)', shadow: 'rgba(16,185,129,0.2)' },
          { Icon: Heart,        value: totalVotes,     label: 'Ovoz',       gradient: 'linear-gradient(135deg,#8B5CF6,#6366F1)', shadow: 'rgba(139,92,246,0.2)' },
          { Icon: Flame,        value: 0,              label: 'Streak',     gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)', shadow: 'rgba(245,158,11,0.2)' },
        ].map((s, i) => (
```

- [ ] **Step 8: Fix badge `earned` state — use `earnedBadgeIds` instead of `badge.earned`**

Find the badges grid map (around line 359). Change `{BADGES.map((badge, i) => (` to use a local `earned` variable:

```tsx
              {BADGES.map((badge, i) => {
                const earned = earnedBadgeIds.includes(badge.id)
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
                    className="rounded-3xl p-4 relative overflow-hidden"
                    style={{
                      background: earned ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                      boxShadow: earned ? '0 4px 20px rgba(59,130,246,0.12)' : '0 1px 4px rgba(15,23,42,0.04)',
                      border: earned ? '1.5px solid rgba(99,102,241,0.2)' : '1.5px solid rgba(148,163,184,0.12)',
                      opacity: earned ? 1 : 0.62,
                    }}
                  >
                    {earned ? (
                      <div className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5">
                        <Lock size={11} style={{ color: '#CBD5E1' }} strokeWidth={2.5} />
                      </div>
                    )}
                    <motion.div
                      className="text-4xl mb-2.5"
                      animate={earned ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                    >
                      {badge.icon}
                    </motion.div>
                    <p className="text-[12.5px] font-bold leading-tight" style={{ color: '#0F172A' }}>{badge.name}</p>
                    <p className="text-[10px] mt-1 leading-snug" style={{ color: '#94A3B8' }}>{badge.description}</p>
                    {badge.progress !== undefined && badge.total ? (
                      <div className="mt-3">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[9px] font-medium" style={{ color: '#94A3B8' }}>{badge.progress}/{badge.total}</span>
                          <span className="text-[9px] font-bold" style={{ color: '#6366F1' }}>+{badge.xpReward} XP</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.2)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(badge.progress / badge.total) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-2">
                        <Zap size={10} style={{ color: '#6366F1' }} strokeWidth={2.5} />
                        <span className="text-[9px] font-bold" style={{ color: '#6366F1' }}>+{badge.xpReward} XP</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
```

- [ ] **Step 9: Replace static leaderboard render with real data**

Find the leaderboard tab content (around line 574, `{LEADERBOARD.map((item, i) => {`). Replace from `{LEADERBOARD.map(...)` to the closing `})}` of that map with:

```tsx
              {leaderboard.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy size={40} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
                  <p className="text-[13px] font-bold" style={{ color: '#94A3B8' }}>Yuklanmoqda...</p>
                </div>
              ) : leaderboard.map((entry, i) => {
                const RANK_STYLES = [
                  { color: '#F59E0B', glow: 'rgba(245,158,11,0.25)',  BadgeIcon: Crown  },
                  { color: '#94A3B8', glow: 'rgba(148,163,184,0.2)',  BadgeIcon: Trophy },
                  { color: '#CD7C3F', glow: 'rgba(205,124,63,0.2)',   BadgeIcon: Trophy },
                ]
                const style = RANK_STYLES[i] ?? { color: '#3B82F6', glow: 'rgba(59,130,246,0.2)', BadgeIcon: Star }
                const { BadgeIcon } = style
                const isMe = entry.telegramId === myTelegramId
                return (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.28 }}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-3xl relative overflow-hidden"
                    style={{
                      background: isMe ? 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.07))' : 'rgba(255,255,255,0.9)',
                      boxShadow: isMe ? '0 4px 20px rgba(59,130,246,0.15)' : '0 2px 10px rgba(15,23,42,0.06)',
                      border: isMe ? '1.5px solid rgba(59,130,246,0.25)' : '1.5px solid rgba(255,255,255,0.7)',
                    }}
                  >
                    <div className="w-7 flex items-center justify-center shrink-0">
                      <BadgeIcon size={16} style={{ color: style.color }} strokeWidth={2.5} />
                    </div>
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black text-white shrink-0"
                      style={{ background: style.color, boxShadow: `0 4px 12px ${style.glow}` }}
                      animate={entry.rank === 1 ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {entry.firstName.charAt(0).toUpperCase()}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[13px] font-bold" style={{ color: '#0F172A' }}>{entry.firstName}</p>
                        {isMe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>Siz</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Users size={9} style={{ color: '#94A3B8' }} strokeWidth={2} />
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>{entry.reportCount} ta ariza</p>
                        <span style={{ color: '#CBD5E1' }}>·</span>
                        <span className="text-[10px] font-medium" style={{ color: getTitle(entry.xp).color }}>{getTitle(entry.xp).label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Zap size={12} style={{ color: '#F59E0B' }} strokeWidth={2.5} />
                        <span className="text-[14px] font-black" style={{ color: '#0F172A' }}>{entry.xp}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: '#94A3B8' }}>XP</p>
                    </div>
                  </motion.div>
                )
              })}
```

- [ ] **Step 10: Update the challenge card at the bottom of the leaderboard**

Find the challenge card (around line 634). Replace the hardcoded content with:

```tsx
              {leaderboard.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-1 rounded-3xl p-4 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.06))', border: '1.5px solid rgba(245,158,11,0.25)', boxShadow: '0 4px 16px rgba(245,158,11,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={15} style={{ color: '#F59E0B' }} strokeWidth={2.5} />
                    <p className="text-[12.5px] font-bold" style={{ color: '#92400E' }}>
                      {leaderboard[0]?.telegramId === myTelegramId
                        ? '1-o\'rindasiz! Davom eting!'
                        : 'Oy oxirigacha 1-o\'ringa chiqing!'}
                    </p>
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: '#78350F' }}>
                    {leaderboard[0]?.telegramId === myTelegramId
                      ? 'Eng faol fuqaro sifatida jamoatingizga rahmat!'
                      : `${leaderboard[0]?.firstName ?? 'Birinchidan'} ${(leaderboard[0]?.xp ?? 0) - xp} XP orqada. Muammolarni bildirib boring!`}
                  </p>
                </motion.div>
              )}
```

- [ ] **Step 11: Verify TypeScript compiles**

```bash
cd frontend
pnpm tsc --noEmit
# Expected: no errors
```

- [ ] **Step 12: Commit**

```bash
cd frontend
git add src/pages/Profile.tsx
git commit -m "feat: wire Profile.tsx to real API — remove mock data, add real leaderboard and stats"
```

---

## Task 3: Update Admin.tsx — remove mock fallbacks

**Files:**
- Modify: `frontend/src/pages/Admin.tsx` (3 targeted edits)

**Interfaces:**
- Consumes: `GET /api/admin/analytics` → `{ total, byStatus: { sent?, in_progress?, resolved? }, avgResolutionDays }`
- Consumes: `GET /api/admin/tickets` → `{ tickets: Report[], total, page, limit }`

- [ ] **Step 1: Fix imports — remove mock and localEvents**

Change lines 14–15 from:

```typescript
import { MOCK_ANALYTICS, SAMPLE_REPORTS } from '../data/mock'
import { onLocalReport } from '../lib/localEvents'
```

to — delete both lines entirely. No replacement needed.

- [ ] **Step 2: Replace mock fallbacks in the initial data load effect**

Change lines 75–96 from:

```typescript
  useEffect(() => {
    Promise.all([
      api.get<AdminAnalytics>('/admin/analytics').catch(() => null),
      api.get<{ tickets: Report[] }>('/admin/tickets').catch(() => null),
    ]).then(([aData, rData]) => {
      if (aData) {
        setAnalytics(aData)
      } else {
        console.warn('[Admin] Server unavailable, using mock analytics')
        setAnalytics(MOCK_ANALYTICS)
      }
      if (rData?.tickets) {
        setReports(rData.tickets)
      } else {
        console.warn('[Admin] Server unavailable, using mock reports')
        setReports(SAMPLE_REPORTS)
      }
      setLoading(false)
    })
  }, [])
```

to:

```typescript
  useEffect(() => {
    Promise.all([
      api.get<AdminAnalytics>('/admin/analytics').catch(() => null),
      api.get<{ tickets: Report[]; total: number }>('/admin/tickets').catch(() => null),
    ]).then(([aData, rData]) => {
      setAnalytics(aData ?? { total: 0, byStatus: {}, avgResolutionDays: 0 })
      setReports(rData?.tickets ?? [])
      setLoading(false)
    })
  }, [])
```

- [ ] **Step 3: Remove `onLocalReport` subscription**

Delete lines 98–108 entirely:

```typescript
  // Listen for locally-created reports (mock mode)
  useEffect(() => {
    return onLocalReport((report) => {
      setReports((prev) => [report, ...prev])
      setAnalytics((prev) => prev ? {
        ...prev,
        total: prev.total + 1,
        byStatus: { ...prev.byStatus, sent: (prev.byStatus.sent ?? 0) + 1 },
      } : prev)
    })
  }, [])
```

- [ ] **Step 4: Fix refresh button — remove mock fallback**

Find the refresh button handler (around line 164–173):

```typescript
          onClick={() => {
            setLoading(true)
            Promise.all([
              api.get<AdminAnalytics>('/admin/analytics').catch(() => null),
              api.get<{ tickets: Report[] }>('/admin/tickets').catch(() => null),
            ]).then(([aData, rData]) => {
              setAnalytics(aData ?? MOCK_ANALYTICS)
              setReports(rData?.tickets ?? SAMPLE_REPORTS)
              setLoading(false)
            })
          }}
```

Change to:

```typescript
          onClick={() => {
            setLoading(true)
            Promise.all([
              api.get<AdminAnalytics>('/admin/analytics').catch(() => null),
              api.get<{ tickets: Report[]; total: number }>('/admin/tickets').catch(() => null),
            ]).then(([aData, rData]) => {
              setAnalytics(aData ?? { total: 0, byStatus: {}, avgResolutionDays: 0 })
              setReports(rData?.tickets ?? [])
              setLoading(false)
            })
          }}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend
pnpm tsc --noEmit
# Expected: no errors
```

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/pages/Admin.tsx
git commit -m "feat: wire Admin.tsx to real API — remove mock fallbacks and onLocalReport"
```

---

## Task 4: Deploy and verify end-to-end

**Files:** None (deploy only)

- [ ] **Step 1: Deploy backend**

```bash
cd server
vercel --prod
# Expected output: Aliased: https://mahallfix-api.vercel.app
```

- [ ] **Step 2: Verify `/leaderboard` and `/auth/me` in production**

```bash
# 1. Leaderboard (public — no auth)
curl -s https://mahallfix-api.vercel.app/api/leaderboard
# Expected: {"ok":true,"data":[{"rank":1,"telegramId":"8313288034","firstName":"Muhammadamin","xp":0,"reportCount":0,"badges":[]}]}

# 2. Get fresh token
python3 << 'EOF'
import hmac, hashlib, urllib.parse, json, subprocess
BOT_TOKEN = "8261209479:AAGQ_V8N79Fosu776jO8mtL5k21Ca-EXl90"
user = {"id": 8313288034, "first_name": "Muhammadamin", "username": "Muhammadamin_Pulatov"}
user_str = json.dumps(user, separators=(',', ':'))
data_check = f"user={user_str}"
secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
hash_val = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
init_data = f"user={urllib.parse.quote(user_str)}&hash={hash_val}"
result = subprocess.run(['curl', '-s', '-X', 'POST',
  'https://mahallfix-api.vercel.app/api/auth/telegram',
  '-H', 'Content-Type: application/json',
  '-d', json.dumps({"initData": init_data, "user": user})],
  capture_output=True, text=True)
d = json.loads(result.stdout)
print("TOKEN:", d.get('data',{}).get('token','FAIL'))
EOF

# 3. Test /auth/me with the token printed above
TOKEN="<paste token from above>"
curl -s "https://mahallfix-api.vercel.app/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('isAdmin:', d['data'].get('isAdmin'))
print('xp:', d['data'].get('xp'))
print('tickets:', len(d['data'].get('tickets',[])))
"
# Expected: isAdmin: True  xp: 0  tickets: 3 (or however many)
```

- [ ] **Step 3: Deploy frontend**

```bash
cd frontend
vercel --prod
# Expected output: Aliased: https://mahallfix-frontend.vercel.app
```

- [ ] **Step 4: Manual smoke test in browser**

Open `https://mahallfix-frontend.vercel.app` in a Telegram WebApp or browser:

1. Go to **Profile tab** → should show real `firstName`, `xp: 0`, `level: 1`
2. Profile → **Reyting tab** → should show 1 real user (Muhammadamin, rank 1, "Siz" badge)
3. Profile → **Nishonlar tab** → all badges should be locked (empty `badges: []`)
4. Profile header → Admin button should appear (since `isAdmin: true`)
5. Tap **Admin button** → Admin panel opens
6. Admin → **Dashboard** → shows `total: 3`, pie chart with 3 slices (or empty if all 0)
7. Admin → **Arizalar** → shows 3 real tickets from DB
8. Admin → Change ticket status → status updates immediately in UI

- [ ] **Step 5: Final commit (if any last-minute fixes)**

```bash
git add -A
git commit -m "fix: post-deploy adjustments"
```
