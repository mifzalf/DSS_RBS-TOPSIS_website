export const WORKFLOW_STEPS = [
  { key: 'model', label: 'Buat model keputusan', description: 'Tentukan nama model dan ruang kerja yang akan digunakan.' },
  { key: 'categories', label: 'Susun tipe keputusan', description: 'Definisikan tipe yang akan menjadi keluaran klasifikasi atau rekomendasi.' },
  { key: 'criteria', label: 'Susun kriteria dan bobot', description: 'Atur kriteria, sub-kriteria, dan bobot untuk perhitungan TOPSIS.' },
  { key: 'alternatives', label: 'Tambahkan alternatif', description: 'Masukkan data alternatif yang akan dianalisis dalam model.' },
  { key: 'evaluations', label: 'Lengkapi evaluasi TOPSIS', description: 'Isi nilai atau pilihan sub-kriteria untuk setiap alternatif.' },
  { key: 'rule-variables', label: 'Siapkan variabel rule', description: 'Tentukan variabel fakta yang akan dipakai pada Rule Base.' },
  { key: 'rules', label: 'Atur Rule Base', description: 'Susun rule dan kondisi untuk mengelompokkan alternatif ke tipe keputusan yang sesuai.' },
  { key: 'rule-evaluations', label: 'Lengkapi evaluasi rule', description: 'Isi nilai fakta tiap alternatif sesuai variabel rule yang tersedia.' },
  { key: 'recommendation', label: 'Tinjau hasil rekomendasi', description: 'Lihat hasil akhir, pengelompokan, dan prioritas yang dihasilkan sistem.' },
]
