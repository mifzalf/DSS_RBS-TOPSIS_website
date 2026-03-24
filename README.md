# DSS RBS–TOPSIS

A web-based Decision Support System (DSS) yang menggabungkan **Rule-Based System (RBS)** dengan metode **TOPSIS** untuk pengambilan keputusan multi-kriteria. Backend menyediakan autentikasi JWT, otorisasi per decision model, serta pipeline rekomendasi lengkap yang dapat diintegrasikan dengan frontend React atau aplikasi lain.

---

## 🚀 Fitur Utama

- CRUD lengkap untuk decision model, anggota (owner/editor/viewer), kriteria, sub-kriteria, alternatif, evaluasi, rules, dan rule condition.
- Autentikasi JWT (register/login) dengan middleware verifikasi token.
- Otorisasi per decision model melalui tabel relasi user ↔ model (`decisionModelUser`).
- Pipeline rekomendasi sinkron (RBS → TOPSIS) yang menyimpan hasil ke tabel `results`.
- Struktur backend modular dan mudah dikembangkan.

---

## 🧠 Gambaran Sistem

Input Data → Rule-Based Filtering → Kandidat → Perhitungan TOPSIS → Ranking → Penyimpanan hasil.

- **Rule-Based System** menyaring/mengklasifikasikan alternatif berdasarkan aturan logis.
- **TOPSIS** menghitung skor preferensi setiap alternatif terhadap solusi ideal.

---

## 🏗️ Arsitektur Backend

1. **Autentikasi** – `POST /auth/register` dan `POST /auth/login` menghasilkan token JWT.
2. **Context User** – middleware `currentUser` memuat profil pengguna setelah token tervalidasi.
3. **Otorisasi** – middleware `authorizeDecisionModel` memastikan role pengguna (owner/editor/viewer) sesuai sebelum controller dijalankan.
4. **Controller** – hanya menangani logika bisnis; validasi dan otorisasi telah ditangani di lapisan rute.
5. **Service** – rule engine, TOPSIS, dan rekomendasi bekerja di layer service untuk menjaga keterpisahan kode.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL (Sequelize ORM)
- **Auth**: JWT, bcrypt
- **Utilities**: dotenv, helmet, cors, morgan

---

## ⚙️ Menjalankan Proyek

```bash
cd backend
npm install
cp .env.example .env   # isi DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, JWT_SECRET
npm run start
```

Contoh variabel lingkungan:

```
PORT=3000
DB_HOST=localhost
DB_NAME=db-dss-rbs-topsis
DB_USERNAME=admin
DB_PASSWORD=passwordku
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=2h
```

---

## 🔐 Autentikasi & Role Decision Model

1. Register atau login untuk mendapatkan token JWT.
2. Sertakan header `Authorization: Bearer <TOKEN>` pada setiap request.
3. Saat membuat decision model, pembuat otomatis menjadi **owner**. Owner dapat menambahkan **editor** atau **viewer** melalui endpoint members.

### Endpoint Manajemen Anggota (Owner Only)

- `GET /decision-model/:decisionModelId/members`
- `POST /decision-model/:decisionModelId/members`
- `PATCH /decision-model/:decisionModelId/members/:memberId`
- `DELETE /decision-model/:decisionModelId/members/:memberId`

---

## 📊 Endpoint Rekomendasi

- `POST /recommendations/decision-model/:decisionModelId` – menjalankan pipeline rekomendasi.
- Tambahkan query `?clear=true` untuk menghapus hasil sebelumnya sebelum kalkulasi ulang.
- Ambil hasil lengkap via `GET /results/decision-model/:decisionModelId`.

```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/recommendations/decision-model/1
```

---

## 📁 Struktur Direktori (Ringkas)

- `controller/` – logika bisnis per resource
- `routes/` – definisi endpoint + middleware otorisasi
- `middleware/` – JWT, `currentUser`, `authorizeDecisionModel`
- `service/` – rule engine, TOPSIS, rekomendasi, otorisasi
- `models/` – Sequelize + relasi `decisionModelUser`
- `utils/` – helper (mis. handler error)

---

## 🔮 Pengembangan Lanjut

- Testing otomatis (Jest/Supertest)
- Rule builder dinamis
- Dashboard analitik & dokumentasi API (Swagger)
- Metode DSS tambahan (AHP, SAW, dsb.)

---

## 👨‍💻 Author

Muhammad Ifzal Faidurrahman  
Diploma in Informatics Engineering  
Politeknik Elektronika Negeri Surabaya

---

## 📄 Lisensi

Proyek ini ditujukan untuk kebutuhan pendidikan dan riset.
