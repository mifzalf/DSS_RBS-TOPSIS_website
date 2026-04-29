import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { useDecisionModel } from '../../features/decision-model/useDecisionModels'
import { Button } from '../ui/Button'

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="menu-toggle-icon">
      <path d="M4 6h12M4 10h12M4 14h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Topbar({ onMenuToggle }) {
  const { pathname } = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const decisionModelQuery = useDecisionModel(id)
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const mobileProfileRef = useRef(null)

  const workspaceMeta = useMemo(() => {
    const decisionModelName = decisionModelQuery.data?.name || 'Ruang kerja program'

    const definitions = [
      { match: (path) => path === `/decision-models/${id}`, title: 'Ringkasan', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/members'), title: 'Anggota', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/assistance-categories'), title: 'Tipe keputusan', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/grade-policies'), title: 'Kebijakan grade', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/criteria'), title: 'Kriteria', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/alternatives'), title: 'Alternatif', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/evaluations'), title: 'Evaluasi TOPSIS', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/rule-evaluations'), title: 'Evaluasi Rule', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/rules'), title: 'Rule Base', subtitle: decisionModelName },
      { match: (path) => path.endsWith('/recommendation'), title: 'Rekomendasi', subtitle: decisionModelName },
    ]

    const active = definitions.find((item) => item.match(pathname))
    return active || { title: 'Model keputusan', subtitle: 'Ruang kerja sistem pendukung keputusan' }
  }, [decisionModelQuery.data?.name, id, pathname])

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
          <button type="button" className="icon-button nav-toggle" onClick={onMenuToggle} aria-label="Buka navigasi">
            <MenuIcon />
          </button>
          <button type="button" className="icon-button nav-toggle-desktop" onClick={onMenuToggle} aria-label="Ubah lebar sidebar">
            <MenuIcon />
          </button>
        </div>

        <div className="topbar-context">
          <div className="topbar-heading">
            <strong className="topbar-title">{workspaceMeta.title}</strong>
            <p>{workspaceMeta.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="user-chip">
          <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          <div className="user-chip-copy">
            <strong>{user?.name || 'Pengguna'}</strong>
            <small>@{user?.username || 'session'}</small>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="topbar-logout-button"
          onClick={handleLogout}
        >
          Keluar
        </Button>
        <div ref={mobileProfileRef} className="mobile-profile-menu">
          <button
            type="button"
            className="mobile-profile-trigger"
            aria-label="Buka menu profil"
            aria-expanded={mobileProfileOpen}
            onClick={() => setMobileProfileOpen((current) => !current)}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </button>
          {mobileProfileOpen ? (
            <div className="mobile-profile-popover">
              <div className="mobile-profile-summary">
                <strong>{user?.name || 'Pengguna'}</strong>
                <small>@{user?.username || 'session'}</small>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mobile-profile-logout"
                onClick={handleLogout}
              >
                Keluar
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
