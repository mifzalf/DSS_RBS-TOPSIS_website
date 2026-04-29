import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

export function NotFoundPage() {
  return (
    <div className="centered-page">
      <div className="surface-panel feedback-state">
        <h1>Halaman tidak ditemukan</h1>
        <p>Rute yang Anda tuju tidak tersedia pada aplikasi ini.</p>
        <Link className="button button-primary" to={ROUTES.decisionModels}>Kembali ke model keputusan</Link>
      </div>
    </div>
  )
}
