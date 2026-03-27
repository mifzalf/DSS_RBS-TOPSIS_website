import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="sidebar-nav-icon">
      <rect x="3" y="3" width="5" height="5" rx="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1.5" />
      <rect x="12" y="12" width="5" height="5" rx="1.5" />
    </svg>
  )
}

function DecisionModelIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="sidebar-nav-icon">
      <path d="M5 4.5h10a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 15 15.5H5A1.5 1.5 0 0 1 3.5 14V6A1.5 1.5 0 0 1 5 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.5 8h7M6.5 10.5h7M6.5 13h4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="menu-toggle-icon">
      <path d="M4 6h12M4 10h12M4 14h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const navigation = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', to: ROUTES.dashboard, hint: 'Overview and activity', icon: <DashboardIcon /> },
      { label: 'Decision Models', to: ROUTES.decisionModels, hint: 'Workflow and setup', icon: <DecisionModelIcon /> },
    ],
  },
]

export function Sidebar({ open, collapsed, onClose }) {
  return (
    <>
      <button
        type="button"
        className={`sidebar-backdrop ${open ? 'visible' : ''}`}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={`app-sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar-brand-row">
          <div className="sidebar-brand-block">
            <span className="brand-mark">DSS</span>
            <div className="sidebar-brand-copy">
              <strong>RBS-TOPSIS</strong>
              <p>Decision support workspace</p>
            </div>
          </div>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <MenuIcon />
          </button>
        </div>

        <div className="sidebar-scrollable">
          <div className="sidebar-section-list">
            {navigation.map((group) => (
              <section key={group.title} className="sidebar-section">
                <span className="sidebar-section-title">{group.title}</span>
                <nav className="sidebar-nav">
                  {group.items.map((item) => (
                    <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                      <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
                      <div className="sidebar-link-copy">
                        <span className="sidebar-link-label">{item.label}</span>
                        <small>{item.hint}</small>
                      </div>
                    </NavLink>
                  ))}
                </nav>
              </section>
            ))}
          </div>

          <div className="sidebar-support surface-panel">
            <strong>Workflow discipline</strong>
            <p>Criteria, alternatives, evaluations, rules, and recommendation stay in one guided track.</p>
          </div>
        </div>
      </aside>
    </>
  )
}
