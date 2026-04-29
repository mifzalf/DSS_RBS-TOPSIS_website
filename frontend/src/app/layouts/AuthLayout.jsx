import { Outlet, useLocation } from 'react-router-dom'

export function AuthLayout() {
  const location = useLocation()

  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <div className="auth-hero-shell">
          <div className="auth-hero-copy stack-lg">
            <div className="stack-md">
              <span className="page-header-eyebrow auth-eyebrow">Decision Support Studio</span>
              <h1>Kelola proses keputusan dalam satu workspace yang jelas dan terarah.</h1>
              <p>
                Bangun model, susun kriteria, evaluasi alternatif, dan hasilkan rekomendasi dalam alur kerja yang rapi,
                praktis, dan mudah ditinjau.
              </p>
            </div>

            <div className="auth-hero-metrics">
              <article className="auth-hero-metric">
                <strong>Klasifikasi lebih terstruktur</strong>
                <span>Kelompokkan alternatif ke tipe keputusan yang sesuai sebelum proses pemeringkatan dilakukan.</span>
              </article>
              <article className="auth-hero-metric">
                <strong>Pemeringkatan lebih jelas</strong>
                <span>Nilai dan urutkan alternatif berdasarkan kriteria yang telah ditetapkan secara konsisten.</span>
              </article>
              <article className="auth-hero-metric">
                <strong>Siap ditinjau bersama</strong>
                <span>Simpan seluruh proses dalam satu tempat agar hasil akhir mudah diverifikasi bersama tim.</span>
              </article>
            </div>
          </div>

          <div className="auth-storyboard">
            <article className="auth-story-card auth-story-card-primary">
              <span className="auth-story-label">Persiapan</span>
              <strong>Susun struktur penilaian</strong>
               <p>Atur tipe keputusan, kriteria, dan data alternatif dalam satu alur kerja yang saling terhubung.</p>
            </article>
            <article className="auth-story-card">
              <span className="auth-story-label">Hasil</span>
              <strong>Output yang fleksibel</strong>
               <p>Sistem dapat digunakan untuk berbagai skenario DSS dengan tipe keputusan yang Anda tentukan sendiri.</p>
            </article>
            <article className="auth-story-card auth-story-card-accent">
              <span className="auth-story-label">Kolaborasi</span>
              <strong>Satu tempat untuk tim</strong>
              <p>Kelola akses anggota, evaluasi alternatif, dan rekomendasi akhir dari workspace yang sama.</p>
            </article>
          </div>
        </div>
      </section>
      <main className="auth-panel">
        <div key={location.pathname} className="auth-route-transition">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
