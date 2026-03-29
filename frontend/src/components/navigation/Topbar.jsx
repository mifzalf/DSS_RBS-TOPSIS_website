import { useEffect, useRef, useState } from 'react'
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
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const mobileProfileRef = useRef(null)

  useEffect(() => {
    const handleOutside = (event) => {
      if (!mobileProfileRef.current?.contains(event.target)) {
        setMobileProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
            <p>Social assistance review space</p>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="user-chip">
          <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          <div className="user-chip-copy">
            <strong>{user?.name || 'User'}</strong>
            <small>@{user?.username || 'session'}</small>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="topbar-logout-button"
          onClick={handleLogout}
        >
          Logout
        </Button>
        <div ref={mobileProfileRef} className="mobile-profile-menu">
          <button
            type="button"
            className="mobile-profile-trigger"
            aria-label="Open profile menu"
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((current) => !current)}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </button>
          {mobileProfileOpen ? (
            <div className="mobile-profile-popover">
              <div className="mobile-profile-summary">
                <strong>{user?.name || 'User'}</strong>
                <small>@{user?.username || 'session'}</small>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mobile-profile-logout"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
