# Frontend Build Plan

Dokumen ini menerjemahkan hasil Phase 1 menjadi langkah implementasi yang konkret.

## Phase 2 - Token and Theme Reset

- Rework typography scale
- Rework spacing scale
- Rework surface, border, and elevation tokens
- Define semantic color tokens for status and layout layers
- Simplify gradients and reduce decorative blur

Deliverable:

- `src/index.css` dan `src/styles/app.css` punya token baru yang lebih cocok untuk admin dashboard

## Phase 3 - App Shell Redesign

- Rebuild sidebar structure and active states
- Rebuild topbar layout and breadcrumb treatment
- Add responsive drawer behavior for small screens
- Normalize page container widths and gutters

Deliverable:

- `AppLayout`, `Sidebar`, dan `Topbar` menjadi shell admin yang stabil

## Phase 4 - Global Density and Responsive Pass

- Resize page header, cards, buttons, badges, and table rows
- Review tablet and mobile breakpoints
- Reduce overly tall sections and empty spaces

Deliverable:

- Semua halaman inti terasa lebih ringkas dan lebih responsif

## Phase 5 - Dashboard and Model Detail Redesign

- Redesign `DashboardPage`
- Redesign `DecisionModelListPage`
- Redesign `DecisionModelDetailPage`
- Establish page pattern for summary, table, and next-step panel

Deliverable:

- Dua halaman inti menjadi acuan visual seluruh aplikasi

## Phase 6 - Data Entry Pages

- Redesign `CriteriaPage`
- Redesign `AlternativesPage`
- Redesign `EvaluationsPage`
- Introduce compact admin-style tables and matrix sections

Deliverable:

- Core data input flow terasa terstruktur dan efisien

## Phase 7 - Rule and Result Pages

- Redesign `RulesPage`
- Redesign `ResultsPage`
- Redesign `RecommendationPage`
- Improve compare/present patterns for final ranking output

Deliverable:

- Output DSS lebih mudah dianalisis dan dipresentasikan

## Phase 8 - Feedback and Hardening

- Add better unauthorized screen
- Refine empty, loading, and error states
- Add confirm flow for destructive actions
- Improve toast behavior and mutation feedback

Deliverable:

- Produk terasa lebih matang dan aman dipakai

## Phase 9 - Testing and QA

- Add tests for auth form rendering
- Add tests for protected route behavior
- Add tests for decision model list rendering
- Add tests for criteria weight validation UI
- Add tests for recommendation loading and result states

Deliverable:

- Fondasi UX dan flow utama punya proteksi regresi
