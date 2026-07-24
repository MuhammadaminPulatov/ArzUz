# Loyiha Qayta Tuzish Dizayni

**Sana:** 2026-07-24  
**Mavzu:** Mahalla Muammolari — `/frontend` `/backend` `/claude` strukturasiga o'tish

---

## Maqsad

Hozirgi tekis papka strukturasini uch qismli toza arxitekturaga o'tkazish:
- `/frontend` — React + Vite ilovasi
- `/backend` — Mock data + kelajak backend shablonlari
- `/claude` — Claude workflow yo'riqnomalari va hujjatlar

---

## Umumiy Papka Strukturasi

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── .mise.toml
├── backend/
│   ├── mock/
│   ├── services/
│   ├── types/
│   └── README.md
├── claude/
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── hooks/
│   ├── skills/
│   └── docs/specs/
└── CLAUDE.md              # Faqat: @claude/CLAUDE.md
```

---

## Frontend Ichki Struktura

### `src/components/` — o'zgarmaydi
- `BottomNav.tsx`
- `Header.tsx`
- `MapPicker.tsx`
- `MyTickets.tsx`
- `ReportCard.tsx`

### `src/hooks/` — yangi (Create.tsx dan ajratiladi)
- `useVote.ts` — ovoz berish holati va logikasi
- `useGPS.ts` — GPS joylashuv olish
- `useVoiceRecorder.ts` — ovoz yozish, timer, SpeechRecognition

### `src/lib/` — yangi
- `utils.ts` — `fmtTime()` va boshqa yordamchi funksiyalar

### `src/types/` — yangi (mock.ts dan ajratiladi)
- `index.ts` — `Report`, `Badge` interfeyslari va `Status` turlari

### `src/pages/` — o'zgarmaydi (fayllar saqlanadi, import yo'llari yangilanadi)
- `Feed.tsx`
- `Create.tsx`
- `Profile.tsx`

---

## Backend Struktura

### `backend/mock/`
- `reports.ts` — `SAMPLE_REPORTS`, `CATEGORIES` (hozirgi `src/data/mock.ts` dan ko'chiriladi)
- `badges.ts` — `BADGES` ma'lumotlari

### `backend/services/` — bo'sh shablonlar
- `reports.service.ts` — `getReports()`, `createReport()`, `voteReport()` imzolari
- `badges.service.ts` — `getBadges()`, `awardBadge()` imzolari

### `backend/types/`
- `index.ts` — `Report`, `Badge` — frontend types bilan mos, lekin mustaqil

### `backend/README.md`
Real backend qo'shish bo'yicha ko'rsatmalar (Supabase, Express yoki boshqa).

---

## Claude Struktura

### `claude/CLAUDE.md`
Hozirgi `AGENTS.md` kontenti + frontend/backend yo'llari yangilanadi.

### `claude/AGENTS.md`
Frontend yo'li `frontend/` ga yangilangan holda.

### `claude/hooks/` va `claude/skills/`
Hozircha bo'sh, kelajak uchun tayyor.

### `claude/docs/specs/`
Barcha brainstorming dizayn hujjatlari (shu fayl ham shu yerda).

### Root `CLAUDE.md`
```
@claude/CLAUDE.md
```

---

## Import Yo'llari O'zgarishi

| Hozir | Keyin |
|-------|-------|
| `../data/mock` | `../../backend/mock/reports` |
| (yo'q) | `../hooks/useVote` |
| (yo'q) | `../hooks/useGPS` |
| (yo'q) | `../hooks/useVoiceRecorder` |
| (yo'q) | `../types` |
| (yo'q) | `../lib/utils` |

Vite `@` alias `frontend/src` ga ko'rsatiladi.

---

## Cheklovlar

- Backend hozircha mock data — haqiqiy API chaqiruvlari yo'q
- Frontend Vite dev server `frontend/` papkadan ishga tushiriladi
- Root darajada `package.json` qolmaydi — barcha skriptlar `frontend/` ichida
