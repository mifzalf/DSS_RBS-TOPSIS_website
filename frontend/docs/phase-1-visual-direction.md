# Phase 1 - Visual Direction Lock

Dokumen ini mengunci arah visual dan UX sebelum redesign shell dan page dilakukan. Referensi utamanya adalah pola admin dashboard seperti Berry, tetapi disesuaikan untuk kebutuhan aplikasi DSS internal.

## 1. Product Character

- Produk adalah dashboard kerja internal untuk menyusun model keputusan, bukan halaman pemasaran.
- UI harus terasa cepat, rapi, tenang, dan terstruktur.
- Tujuan utama bukan "wow visual", tetapi "cepat paham, cepat input, cepat review hasil".

## 2. What We Borrow from Berry

- Light-first admin dashboard dengan hierarchy jelas.
- Sidebar dan topbar yang konsisten di seluruh aplikasi.
- Card, table, form, dan status block yang fungsional, bukan dekoratif.
- Typography yang hemat ruang dan nyaman untuk data-heavy screens.
- Responsive behavior yang fokus pada usability, bukan hanya stacking layout.

## 3. What We Should Avoid

- Hero text besar seperti landing page.
- Gradien dominan yang mengurangi kesan aplikasi kerja.
- Card terlalu tinggi dengan whitespace berlebihan.
- Sidebar dan auth layout yang terlalu kaku pada tablet.
- Halaman dengan banyak teks penjelasan panjang di atas fold.

## 4. Current UI Audit

### Strengths

- Fondasi routing, shell, API layer, dan page structure sudah rapi.
- Komponen dasar seperti table, badge, modal, form field, dan feedback state sudah tersedia.
- Workflow DSS sudah mulai terlihat di decision model detail.

### Gaps to Fix

- Tipografi utama terlalu besar untuk admin UI.
- Density masih longgar sehingga informasi yang muat di layar terlalu sedikit.
- Sidebar, card, dan page header masih terasa seperti showcase layout.
- Responsive behavior belum terasa matang untuk tablet dan mobile.
- Visual language belum cukup netral dan sistematis untuk data-heavy usage.

## 5. Visual Principles

### Tone

- Professional
- Analytical
- Calm
- Clean
- Light-first

### Emotional Goal

- User merasa sistem terstruktur.
- User tahu langkah berikutnya.
- User tidak takut salah saat input data.
- User mudah menjelaskan hasil akhir ke dosen, tim, atau stakeholder.

## 6. Target Visual System

### Layout

- Shell admin standar: sidebar kiri, topbar atas, content canvas utama.
- Content width lebar tetapi tetap punya gutter konsisten.
- Setiap page punya pola: page header ringkas, summary/stat row, main card/table, secondary insight panel.

### Typography

- H1 untuk page title: medium, bukan hero.
- H2 untuk section title: jelas tapi ringkas.
- Body text default harus lebih kecil dari versi sekarang.
- Metadata, hint, dan helper memakai style yang tenang dan tidak kontras berlebihan.

### Color

- Base neutral terang: mist, white, slate tint.
- Aksen utama: teal-blue.
- Success, warning, danger tetap jelas tetapi tidak neon.
- Surface dibedakan lewat layer dan border, bukan gradien besar.

### Elevation

- Shadow lebih tipis dari versi saat ini.
- Surface separation lebih banyak mengandalkan border halus.
- Blur dipakai minimal atau dihapus pada area tertentu.

### Radius

- Radius medium, lebih dekat ke dashboard modern daripada glassmorphism card besar.

## 7. UX Rules

### Rule 1 - Data First

- Tabel, filter, form, status, dan ranking harus menjadi pusat layout.
- Copy penjelasan cukup singkat dan kontekstual.

### Rule 2 - Action Clarity

- Primary action terlihat jelas per page.
- Secondary actions tidak boleh menyaingi CTA utama.

### Rule 3 - Step Awareness

- Decision model harus selalu menunjukkan progress workflow.
- User harus tahu apakah langkah berikutnya adalah criteria, alternatives, evaluations, rules, atau recommendation.

### Rule 4 - Validation Visibility

- Error form inline.
- Error request via toast/banner.
- Incomplete state ditandai dengan badge/progress/warning yang langsung terlihat.

### Rule 5 - Compact but Comfortable

- Tidak terlalu padat seperti sistem enterprise lama.
- Tidak terlalu lega seperti landing page.
- Targetnya adalah medium density yang enak untuk kerja harian.

## 8. Component Direction

### App Shell

- Sidebar lebih ramping, grouping menu jelas, active state halus.
- Topbar lebih sederhana, fokus pada breadcrumb, judul halaman, dan user context.

### Cards

- Card untuk grouping informasi, bukan dekorasi.
- Judul singkat, spacing efisien, body padat.

### Tables

- Header stabil, row height compact-comfortable.
- Focus pada scanability untuk rank, score, weight, role, status.

### Forms

- Label, hint, dan error konsisten.
- Input, select, number field harus cocok untuk repeated data entry.

### Feedback States

- Empty state singkat dan actionable.
- Loading state ringan.
- Error state jelas dan tidak dramatis.

## 9. Responsive Direction

- Desktop-first, tetapi tidak desktop-only.
- Tablet harus tetap nyaman untuk review dan sebagian input.
- Mobile fokus pada akses, pengecekan status, dan tindakan ringan.
- Sidebar berubah menjadi drawer pada layar kecil.
- Table tetap bisa dipakai lewat scroll container yang rapi.

## 10. Design Decisions Locked for Phase 2

- Tidak memakai hero typography besar untuk page internal.
- Tidak memakai layout auth dengan proporsi terlalu dominan seperti splash page.
- Tidak memakai glass-heavy visual language sebagai arah utama.
- Shell akan digeser ke admin dashboard style yang lebih netral.
- Density global akan diturunkan dari versi saat ini.

## 11. Immediate Targets for Redesign

1. Kecilkan skala typography global.
2. Turunkan radius, blur, dan shadow intensity.
3. Rapikan sidebar dan topbar agar terasa lebih seperti admin shell.
4. Buat page header lebih ringkas.
5. Rebalance grid, spacing, dan card padding untuk data-heavy screens.
6. Siapkan breakpoint yang lebih realistis untuk tablet dan mobile.

## 12. Definition of Done for Phase 1

- Arah visual sudah disepakati.
- Prinsip UX untuk semua page sudah terkunci.
- Anti-pattern sudah jelas sehingga fase implementasi tidak kembali ke gaya landing page.
- Fase berikutnya bisa langsung masuk ke token dan shell redesign tanpa debat arah dasar.
