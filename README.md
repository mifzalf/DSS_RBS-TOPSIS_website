# DSS RBS–TOPSIS

Aplikasi ini merupakan kerangka Decision Support System berbasis web yang menggabungkan Rule-Based System (RBS) dan metode TOPSIS untuk pengambilan keputusan multi-kriteria. Backend menyediakan autentikasi JWT, otorisasi per decision model, serta proses rekomendasi yang dapat diintegrasikan dengan frontend React.

## Fitur Utama

- CRUD lengkap untuk decision model, anggota (owner/editor/viewer), kriteria, sub-kriteria, alternatif, evaluasi, rules, dan rule condition.
- Autentikasi JWT dengan endpoint register/login dan middleware verifikasi token.
- Otorisasi berbasis decision model melalui relasi user ↔ model (`decisionModelUser`).
- Proses rekomendasi sinkron yang menjalankan RBS dan TOPSIS lalu menyimpan hasil ke tabel `results`.
- API REST yang siap dikonsumsi oleh aplikasi frontend.

## Arsitektur Backend

1. **Autentikasi** – `POST /auth/register` dan `POST /auth/login` menghasilkan token JWT. Semua endpoint lain mewajibkan header `Authorization: Bearer <token>`.
2. **Konteks User** – middleware `currentUser` memuat profil pengguna dari DB setelah token tervalidasi.
3. **Otorisasi** – middleware `authorizeDecisionModel` menggunakan service otorisasi untuk memastikan role pengguna sesuai sebelum controller dieksekusi.
4. **Controller** – fokus pada logika bisnis karena autentikasi/otorisasi dan pemuatan entitas dilakukan di layer route.
5. **Service Rekomendasi** – modul TOPSIS dan rule engine mengolah data dan menghasilkan ranking akhir.

## Teknologi

- **Backend**: Node.js, Express.js
- **Database**: MySQL (Sequelize ORM)
- **Autentikasi**: JWT + bcrypt
- **Lainnya**: dotenv, helmet, cors, morgan

## Menjalankan Proyek

```bash
cd backend
npm install
cp .env.example .env   # isi DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, JWT_SECRET
npm run start
```

Variabel lingkungan penting:

```
PORT=3000
DB_HOST=localhost
DB_NAME=db-dss-rbs-topsis
DB_USERNAME=admin
DB_PASSWORD=passwordku
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=2h
```

## Alur Autentikasi & Role

1. Register atau login untuk mendapatkan token JWT.
2. Kirim token melalui header `Authorization: Bearer <token>`.
3. Saat membuat decision model, pembuat otomatis menjadi **owner**. Owner dapat menambah **editor** atau **viewer** melalui endpoint members.

### Endpoint Manajemen Anggota (owner-only)

- `GET /decision-model/:decisionModelId/members`
- `POST /decision-model/:decisionModelId/members`
- `PATCH /decision-model/:decisionModelId/members/:memberId`
- `DELETE /decision-model/:decisionModelId/members/:memberId`

## Endpoint Rekomendasi

`POST /recommendations/decision-model/:decisionModelId`

- Query opsional `?clear=true` untuk menghapus hasil lama sebelum menjalankan ulang.
- Respons berisi ringkasan decision model dan daftar hasil ranking terbaru.
- Data lengkap dapat diambil melalui `GET /results/decision-model/:decisionModelId`.

```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/recommendations/decision-model/1
```

## Struktur Direktori

- `controller/` – logika bisnis per resource.
- `routes/` – deklarasi endpoint beserta middleware otorisasi.
- `middleware/` – JWT, `currentUser`, dan `authorizeDecisionModel`.
- `service/` – rekomendasi, otorisasi, helper lainnya.
- `models/` – definisi Sequelize termasuk relasi `decisionModelUser`.
- `utils/` – helper penanganan error (`controllerError`).

## Pengembangan Lanjut

- Tambahkan testing otomatis (Jest/Supertest) untuk auth, otorisasi, dan rekomendasi.
- Bangun logging terstruktur atau monitoring untuk produksi.
- Integrasikan UI React guna memanfaatkan seluruh API ini.

## Kontributor

- Putri Selly Agustin – [pselly0504@gmail.com](mailto:pselly0504@gmail.com)
- Muhamad Fahrurozi

"Terima kasih telah mendukung pengembangan sistem rekomendasi data mining ini. Semoga bermanfaat dalam membantu pengambilan keputusan yang lebih baik."
