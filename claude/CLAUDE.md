# Mahalla Muammolari — Claude Yo'riqnomasi

Toshkent fuqarolari uchun mahalla muammolarini bildirishnoma yuborish imkonini beruvchi Telegram Mini App.

## Arxitektura

- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 (`frontend/`)
- **Backend**: Mock data, kelajakda real API bilan almashtiriladi (`backend/`)
- **Claude**: Workflow va spesifikatsiyalar (`claude/`)

## Muhim Qoidalar

1. Mock ma'lumotlarni `backend/mock/` da o'zgartiring — `frontend/src/data/mock.ts` ni EMAS
2. Yangi TypeScript turlari → `frontend/src/types/index.ts` va `backend/types/index.ts`
3. Yangi logika → hook sifatida `frontend/src/hooks/` ga qo'shilsin
4. Dev server: `cd frontend && pnpm dev`

## Agent Ko'rsatmalari

@claude/AGENTS.md
