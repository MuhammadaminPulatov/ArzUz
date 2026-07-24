# Backend

Hozircha mock data ishlatilmoqda. Real backend qo'shilganda:

1. `services/` funksiyalarini haqiqiy API chaqiruvlari bilan almashtiring
2. `mock/` papkani o'chiring yoki test uchun qoldiring
3. `types/index.ts` ni backend sxemasi bilan moslashtiring

## Papka tuzilmasi

- `mock/` — Statik test ma'lumotlari (SAMPLE_REPORTS, CATEGORIES, BADGES)
- `services/` — Ma'lumot olish/yuborish funksiyalari (API abstraction layer)
- `types/` — TypeScript interfeyslari
