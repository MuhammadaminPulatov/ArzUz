# Mahalla Muammolari — figma-make-app

React + Vite + Tailwind CSS v4 loyihasi. **Barcha kod `frontend/` papkada.**

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
├── frontend/              # React + Vite ilovasi — ASOSIY KOD
│   ├── src/
│   │   ├── components/    # UI komponentlar
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Yordamchi funksiyalar (utils)
│   │   ├── pages/         # Sahifalar
│   │   ├── types/         # TypeScript interfeyslari
│   │   ├── data/mock.ts   # @backend dan re-export (bevosita o'zgartirmang)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Mock data va service shablonlari
│   ├── mock/              # SAMPLE_REPORTS, CATEGORIES, BADGES
│   ├── services/          # API abstraction (hozir mock qaytaradi)
│   └── types/
└── claude/                # Claude workflow (bu papka)
```

## Key Files

- `frontend/src/App.tsx` — Tab navigatsiya, Framer Motion animatsiyalar
- `frontend/src/pages/Feed.tsx` — Muammolar ro'yxati, filtrlash, voting
- `frontend/src/pages/Create.tsx` — 5 bosqichli ariza (photo → location → description → AI → confirm)
- `frontend/src/pages/Profile.tsx` — XP, nishonlar, liderlar jadvali
- `frontend/src/hooks/useVote.ts` — Ovoz berish holati
- `frontend/src/hooks/useGPS.ts` — GPS joylashuv
- `frontend/src/hooks/useVoiceRecorder.ts` — Ovoz yozish
- `frontend/src/lib/utils.ts` — `fmtTime()` va boshqalar
- `backend/mock/reports.ts` — Asosiy mock ma'lumotlar (SAMPLE_REPORTS, CATEGORIES)
- `backend/mock/badges.ts` — BADGES ma'lumotlari

## Aliases

- `@` → `frontend/src/`
- `@backend` → `backend/`

## Dependencies

- Runtime: React 19, Framer Motion, Leaflet, Lucide React
- Styling: Tailwind CSS v4
- Build: Vite 8, TypeScript 5.7
- Package manager: pnpm

## Styling

Tailwind CSS v4 ishlatiladi. `frontend/src/index.css` da `@import 'tailwindcss';` mavjud. Global CSS yoki tema o'zgarishlari shu faylda amalga oshiriladi. Tailwind config fayli kerak emas.
