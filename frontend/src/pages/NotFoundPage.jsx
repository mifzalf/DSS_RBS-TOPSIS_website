import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

export function NotFoundPage() {
  return (
    <div className="centered-page">
      <div className="surface-panel feedback-state">
        <h1>Page not found</h1>
        <p>The requested route does not exist in the current frontend shell.</p>
        <Link className="button button-primary" to={ROUTES.dashboard}>Back to dashboard</Link>
      </div>
    </div>
  )
}
