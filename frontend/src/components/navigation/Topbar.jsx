import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Button } from '../ui/Button'

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="menu-toggle-icon">
      <path d="M4 6h12M4 10h12M4 14h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Topbar({ onMenuToggle }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <header className="topbar surface-panel">
      <div className="topbar-main">
        <div className="topbar-leading">
          <button type="button" className="icon-button nav-toggle" onClick={onMenuToggle} aria-label="Toggle navigation">
            <MenuIcon />
          </button>
          <button type="button" className="icon-button nav-toggle-desktop" onClick={onMenuToggle} aria-label="Toggle sidebar width">
            <MenuIcon />
          </button>
        </div>

        <div className="topbar-context">
          <div className="topbar-heading">
            <strong className="topbar-title">DSS RBS-TOPSIS</strong>
            <p>Internal decision support workspace</p>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="user-chip">
          <span>{user?.name?.[0] || 'U'}</span>
          <div>
            <strong>{user?.name || 'User'}</strong>
            <small>@{user?.username || 'session'}</small>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  )
}
