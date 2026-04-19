# Frontend DSS RBS-TOPSIS

Frontend ini dibangun sebagai dashboard internal untuk workflow DSS, bukan landing page atau kumpulan CRUD yang terpisah.

## Fokus Arsitektur

- `src/app/` - shell aplikasi, router, provider, dan layout terpisah untuk halaman awal vs workspace model
- `src/pages/` - entry screen yang disusun mengikuti grup workspace: `general`, `topsis`, `rule-base`, `alternatives`, plus `decision-model` sebagai hub
- `src/features/` - hooks server-state dan logic per domain frontend (contoh: `alternatives`, `assistance-categories`, `grade-policies`)
- `src/components/` - UI primitives, form, feedback, navigation, data display
- `src/services/` - HTTP client dan wrapper API backend dengan naming yang mengikuti domain frontend
- `src/constants/` - route constants, workflow copy, dan option lists yang dipisah per concern
- `src/styles/` - global styles dan token visual

## Dokumen Desain

- `docs/phase-1-visual-direction.md` - hasil Fase 1: visual direction lock dan UX rules
- `docs/frontend-build-plan.md` - rencana implementasi step by step setelah Fase 1

## Perintah Utama

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Catatan

- Base API menggunakan `VITE_API_BASE_URL`
- Session auth memakai token bearer yang disimpan di local storage
- Halaman awal setelah login langsung menuju `Decision Models`
- Sidebar hanya aktif saat masuk ke workspace decision model
