-- Update deskripsi seluruh alternatif pada decision model Sumenep
-- menjadi alamat buatan di sekitar Desa Kalimo'ok,
-- Kecamatan Kalianget, Kabupaten Sumenep, Provinsi Jawa Timur.
--
-- Catatan:
-- - Jalankan setelah backup tabel `alternatives`.
-- - Sesuaikan filter decision_model_id jika data Anda berbeda.

START TRANSACTION;

UPDATE alternatives
SET description = CONCAT(
   'Jl. Raya Kalimo''ok RT ',
   LPAD(((id - 1) % 12) + 1, 2, '0'),
   ' RW ',
   LPAD(((id - 1) % 5) + 1, 2, '0'),
   ', Dusun ',
   ELT(((id - 1) % 5) + 1, 'Tengah', 'Barat', 'Timur', 'Utara', 'Selatan'),
   ', Desa Kalimo''ok, Kecamatan Kalianget, Kabupaten Sumenep, Provinsi Jawa Timur 69471'
)
WHERE decision_model_id = 2;

COMMIT;

-- Verifikasi cepat
-- SELECT id, name, description FROM alternatives WHERE decision_model_id = 2 ORDER BY id;
