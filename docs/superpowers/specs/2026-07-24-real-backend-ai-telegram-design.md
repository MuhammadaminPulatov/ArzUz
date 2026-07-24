# MahallFix — Real Backend, Vision AI & Telegram Integration Design

**Date:** 2026-07-24  
**Scope:** Production backend, Vision AI pipeline, Telegram Bot integration, monetization  
**Status:** Approved

---

## 1. Goal

Upgrade MahallFix from a mock-data prototype to a production-ready civic issue reporting platform. Citizens photograph infrastructure problems → AI analyzes and writes official text → ticket is formed and sent to the municipal Telegram channel + admin panel → officials update status in one click.

Core civic function (reporting) is always free and unlimited. Monetization comes from premium status features and B2B municipal subscriptions — never from gatekeeping reporting.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│              Telegram Mini App (Frontend)            │
│         React 19 + Vite → Vercel                    │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP REST + Socket.io
┌──────────────────▼──────────────────────────────────┐
│          Node.js API Server → Railway               │
│  Express + Socket.io + Telegram Bot API             │
│  Routes: /tickets  /ai  /payments  /admin  /tg      │
└───────┬──────────────┬──────────────────────────────┘
        │              │
┌───────▼──────┐ ┌─────▼──────────────┐
│ MongoDB Atlas│ │  Vercel Blob       │
│  tickets     │ │  (photos)          │
│  users       │ └────────────────────┘
│  payments    │
└──────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│  Gemini 2.5 Flash (free tier)                    │
│  Vision + Uzbek text generation                  │
│  Free: 1,500 req/day, 1M tokens/day              │
└──────────────────────────────────────────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│  Telegram Bot API                                │
│  → Channel announcement post (with inline btns) │
│  → Webhook → status sync → WebSocket broadcast  │
└──────────────────────────────────────────────────┘
```

**Deployment:**
- Frontend: Vercel (auto-deploy from main branch)
- Backend: Railway ($5/mo), or Render free tier for MVP
- Database: MongoDB Atlas (M0 free tier for MVP)
- Photos: Vercel Blob (free tier: 500MB)
- AI: Google AI Studio free tier (Gemini 2.5 Flash)

---

## 3. Database Schema (MongoDB)

### `tickets` collection

```typescript
{
  _id: ObjectId,
  ticketId: string,           // "MFX-2026-00847" — sequential
  userId: string,             // Telegram user ID
  username: string,
  firstName: string,

  // Photo
  photoUrl: string,           // Vercel Blob CDN URL
  photoThumbnailUrl: string,

  // AI-generated (Gemini)
  category: string,           // "pothole" | "lamp" | "water" | "waste" | ...
  categoryLabel: string,      // "Yo'l nosozligi"
  severity: "low" | "medium" | "high" | "critical",
  aiTitle: string,
  aiDescription: string,      // official Uzbek complaint text
  department: string,         // responsible department name
  aiConfidence: number,       // 0-1

  // User-provided
  lat: number,
  lng: number,
  address: string,
  district: string,
  userNote: string,

  // System
  status: "new" | "sent" | "in_progress" | "resolved" | "rejected",
  priority: "normal" | "verified",   // "verified" = paid priority
  votes: number,
  voterIds: string[],

  // Telegram
  channelMessageId: number,   // message ID in municipal channel
  
  createdAt: Date,
  updatedAt: Date,
  resolvedAt?: Date,
}
```

### `users` collection

```typescript
{
  _id: ObjectId,
  telegramId: string,         // primary key from Telegram
  username: string,
  firstName: string,
  photoUrl?: string,

  // Gamification
  xp: number,
  level: number,
  badges: string[],           // badge IDs earned

  // Subscription
  plan: "free" | "premium",
  planExpiresAt?: Date,

  // Stats
  reportCount: number,
  resolvedCount: number,
  
  createdAt: Date,
  lastActiveAt: Date,
}
```

### `payments` collection

```typescript
{
  _id: ObjectId,
  userId: string,
  type: "premium_monthly" | "premium_yearly" | "verified_report",

  // Telegram Stars
  method: "telegram_stars" | "payme" | "click" | "stripe",
  stars?: number,
  telegramChargeId?: string,

  // Card payment (Payme / Click / Stripe)
  amount?: number,
  currency?: "UZS" | "USD",
  providerOrderId?: string,

  ticketId?: string,          // for "verified_report" type
  status: "pending" | "confirmed" | "failed" | "refunded",
  createdAt: Date,
}
```

**Ticket ID format:** `MFX-YYYY-NNNNN`  
Counter stored in a `counters` collection, incremented atomically with `findOneAndUpdate`.

---

## 4. API Endpoints (Node.js / Express)

### Tickets
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tickets` | Paginated feed (filter by category, district, status) |
| GET | `/api/tickets/:id` | Single ticket detail |
| POST | `/api/tickets` | Create ticket (multipart: photo + metadata) |
| PATCH | `/api/tickets/:id/status` | Admin: update status |
| POST | `/api/tickets/:id/vote` | Upvote |

### AI
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/analyze` | Upload photo URL → Gemini analysis → return JSON |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments/invoice` | Create Telegram Stars invoice |
| POST | `/api/payments/confirm` | Telegram Stars webhook confirm |
| POST | `/api/payments/payme` | Payme callback |
| POST | `/api/payments/click` | Click callback |
| GET | `/api/payments/history` | User payment history |

### Telegram Bot
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tg/webhook` | Incoming Telegram updates (inline btn presses) |
| POST | `/api/tg/send` | Internal: send ticket to channel |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/tickets` | All tickets with filters |
| GET | `/api/admin/analytics` | Dashboard stats |
| PATCH | `/api/admin/tickets/:id` | Update any ticket field |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/telegram` | Verify Telegram Mini App `initData`, return JWT |

All protected endpoints require `Authorization: Bearer <jwt>` header. JWT contains `telegramId`, `plan`.

---

## 5. AI Pipeline (Gemini 2.5 Flash — Free Tier)

Single API call handles both vision analysis and text generation.

**Request:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```

**System prompt:**
```
You are an assistant for a civic issue reporting app in Uzbekistan.
Analyze the image and the user's note, then return ONLY valid JSON.
```

**User prompt:**
```json
{
  "instruction": "Analyze this infrastructure problem photo.",
  "userNote": "<user's raw description>",
  "address": "<reverse-geocoded address>",
  "outputFormat": {
    "category": "one of: pothole|lamp|water|waste|electricity|green|other",
    "categoryLabel": "Uzbek label e.g. Yo'l nosozligi",
    "severity": "low|medium|high|critical",
    "department": "responsible department in Uzbek",
    "aiTitle": "short official title in Uzbek (max 60 chars)",
    "aiDescription": "formal official complaint paragraph in Uzbek (100-150 words)",
    "confidence": 0.0
  }
}
```

**Fallback:** If Gemini rate limit hit (>1500/day), fall back to Gemini 1.5 Flash (also free). If both fail, return `{ aiUnavailable: true }` and let the user fill in manually.

**Timing:** ~2-4 seconds per analysis.

---

## 6. Telegram Integration

### Channel Announcement Format

```
📋 MFX-2026-00847 | 🔴 YUQORI MUHIMLIK

Yo'l qoplamasi buzilishi
📍 Yunusobod tumani, 4-mavze, 12-ko'cha
🏢 Yo'l xo'jaligi boshqarmasi

Yo'l qoplamasi jiddiy darajada buzilgan bo'lib, transport
vositalariga va piyodalarga xavf tug'dirmoqda. Zudlik
bilan ta'mirlash ishlari olib borilishi so'raladi.

Status: Ko'rib chiqilmoqda
Fuqaro: @username
Sana: 2026-07-24 21:15
```

Verified tickets get a `⭐ TEZKOR` prefix line.

**Inline keyboard (for admin channel members):**
```
[✅ Qabul qilish] [🔧 Jarayonda] [✔️ Hal qilindi] [❌ Rad etish]
```

Button press → Telegram webhook → `/api/tg/webhook` → MongoDB update → WebSocket broadcast → Frontend live update → Channel message edited.

### Mini App→Bot Flow
1. User submits ticket in Mini App
2. Backend saves to MongoDB, gets `ticketId`
3. Backend calls `sendPhoto` to Telegram channel with caption + inline keyboard
4. Stores returned `message_id` in `tickets.channelMessageId`
5. On status change: calls `editMessageReplyMarkup` to update inline buttons, `editMessageCaption` to update status line

---

## 7. WebSocket (Socket.io)

**Events:**
```typescript
// Server → Client
"ticket:created"   → { ticket }          // new ticket in feed
"ticket:updated"   → { ticketId, status } // status changed
"ticket:voted"     → { ticketId, votes }

// Client → Server
"subscribe:feed"   → subscribe to district/category updates
"subscribe:ticket" → subscribe to single ticket updates
```

Admin panel subscribes to all events. Feed page subscribes to its current filter. Ticket detail page subscribes to its ticket ID.

---

## 8. Monetization

### Premium Subscription
- **Free plan:** Unlimited ticket creation, full AI analysis, Telegram channel posting — all core features
- **Premium plan (299 Stars/month or 2490 Stars/year):**
  - "Verified" badge on profile
  - Exclusive profile themes and badge frame
  - Full ticket history (free = 30 days)
  - Priority display in feed (subtle sort boost)
  - Advanced personal stats

### Verified Report (one-time, anyone)
- **99 Stars or 15,000 UZS** per ticket
- Ticket gets `priority: "verified"` status
- Channel post shows `⭐ TEZKOR` prefix
- SLA: admins see it at top of admin queue

### Payment Flows
1. **Telegram Stars:** `sendInvoice` from bot → `pre_checkout_query` → `successful_payment` webhook → backend confirms → MongoDB updated
2. **Payme/Click:** Mini App opens Payme/Click payment page (redirect) → callback URL → backend confirms → MongoDB updated
3. **Stripe:** For future international use

### B2B (Municipal SaaS — future)
- Each district/city admin panel as a paid subscription
- Private Telegram channel per district
- Analytics API access
- This is the primary long-term revenue source; designed for but not built in Phase 1

---

## 9. Frontend Changes

All existing pages preserved. Real API replaces mock calls.

### Modified Pages

**`Create.tsx`** (5-step wizard preserved):
- Step 1 (Photo): Upload to Vercel Blob via signed URL → trigger AI analysis
- New loading state: "AI tahlil qilmoqda..." (2-4s skeleton)
- Step 2 (Location): GPS + editable Leaflet map (no change)
- Step 3 (Description): Pre-populated with AI text, user can edit
- Step 4 (Format): Review AI output (no change)
- Step 5 (Confirm): Optional "Verified qilish" upsell card (99 Stars button)
- Submit → real POST `/api/tickets`

**`Feed.tsx`:**
- Real GET `/api/tickets` with infinite scroll
- Socket.io listener: live new tickets appear at top
- Status badge updates in real-time

**`Profile.tsx`:**
- Real user data from MongoDB
- Subscription status + expiry date
- "Premium olish" button → PaymentPage
- Payment history tab

**`Admin.tsx`:**
- Real ticket data with live WebSocket feed
- Status update → PATCH API + Telegram post edit
- District map fed from real aggregation

### New Pages/Components

**`PaymentPage.tsx`:**
- Plan selector (Free / Premium Monthly / Premium Yearly)
- Payment method selector (Stars / Payme / Click)
- Invoice creation and status polling

**`TicketDetailPage.tsx`:**
- Full ticket view with timeline
- PDF export button (uses browser print)
- Share to Telegram button

**`useAuth.ts` hook:**
- Reads Telegram `window.Telegram.WebApp.initData`
- POST to `/api/auth/telegram` → stores JWT in memory

**`useSocket.ts` hook:**
- Socket.io connection lifecycle
- Reconnect on disconnect

---

## 10. Security

- All writes require valid Telegram JWT (verified server-side with bot token HMAC)
- Admin routes require `isAdmin: true` in JWT (manually whitelisted Telegram IDs in env)
- Telegram `initData` validated server-side on every auth request (standard Telegram Mini App auth)
- Photo uploads: only accepted via server-generated Vercel Blob signed upload URLs (prevents direct blob writes)
- Rate limiting: 10 ticket creates per user per day (anti-spam, not a monetization gate)
- Payment callbacks verified by provider signature

---

## 11. Category → Department Mapping

| Category | Department (Uzbek) |
|----------|-------------------|
| pothole | Yo'l xo'jaligi boshqarmasi |
| lamp | Kommunal xizmatlar bo'limi |
| water | Suv ta'minoti xizmati |
| waste | Sanitariya va tozalash xizmati |
| electricity | "O'zbekenergо" hududiy bo'limi |
| green | Ko'kalamzorlashtirish xizmati |
| other | Tuman hokimligi |

---

## 12. Environment Variables

**Backend (Railway):**
```
MONGODB_URI=
GEMINI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
JWT_SECRET=
VERCEL_BLOB_READ_WRITE_TOKEN=
ADMIN_TELEGRAM_IDS=123456789,987654321
PAYME_MERCHANT_ID=
PAYME_SECRET_KEY=
CLICK_MERCHANT_ID=
CLICK_SECRET_KEY=
```

**Frontend (Vercel):**
```
VITE_API_BASE_URL=https://your-app.railway.app
VITE_SOCKET_URL=https://your-app.railway.app
```

---

## 13. Phased Delivery

**Phase 1 — Core Backend (Week 1-2):**
- MongoDB setup, ticket CRUD API, auth, photo upload to Vercel Blob
- Replace all mock calls in frontend with real API
- WebSocket for status updates

**Phase 2 — AI Pipeline (Week 2-3):**
- Gemini integration in Create flow
- AI loading state, edit/override UI

**Phase 3 — Telegram Bot (Week 3-4):**
- Bot sends channel announcements
- Inline button webhook → status sync

**Phase 4 — Monetization (Week 4-5):**
- Telegram Stars payment flow
- Payme/Click integration
- Premium plan enforcement (badge + UI only, no functional gate)

---

## Out of Scope (v1)

- Push notifications (Telegram Bot can message users directly — future)
- Offline mode / PWA
- Multi-language UI (currently Uzbek only)
- B2B municipal SaaS billing portal
- Machine learning model training on local data
