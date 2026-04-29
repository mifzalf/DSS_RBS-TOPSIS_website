import { NavLink, useNavigate } from 'react-router-dom'
import { useDecisionModel } from '../../features/decision-model/useDecisionModels'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="menu-toggle-icon">
      <path d="M4 6h12M4 10h12M4 14h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="sidebar-nav-icon">
      <path d="M11.5 5 6.5 10l5 5" />
      <path d="M7 10h7" />
    </svg>
  )
}

const WORKSHOP_NAV = [
  { label: 'Ringkasan', icon: 'M4 5h12M4 5v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5M7 9h6M7 12h4', getHref: (id) => `/decision-models/${id}` },
  { label: 'Anggota', icon: 'M8 7a2 2 0 1 0 3.99-.05A2 2 0 0 0 8 7zm-2.5 7c0-2.5 3-4.5 6.5-4.5s6.5 2 6.5 4.5', getHref: (id) => `/decision-models/${id}/members` },
  { label: 'Kategori', icon: 'M3 5h4l2-2h8v12H3zm0 0v12', getHref: (id) => `/decision-models/${id}/assistance-categories` },
  { label: 'Kelola pemeringkatan', icon: 'M5 12V8h3v4zm4 0V5h3v7zm4 0v-4h3v4z', getHref: (id) => `/decision-models/${id}/grade-policies` },
  { label: 'Kriteria', icon: 'M5 5h3v10H5zm7 0h3v10h-3z', getHref: (id) => `/decision-models/${id}/criteria` },
  { label: 'Rule Base', icon: 'M4 6h4l2-2h6v10H4z', getHref: (id) => `/decision-models/${id}/rules` },
]

const RECOMMENDATION_NAV = [
  { label: 'Alternatif', icon: 'M4 6h12M4 6v9a1 1 0 0 0 1 1h10M4 10h12', getHref: (id) => `/decision-models/${id}/recommendation/alternatives` },
  { label: 'Evaluasi', icon: 'M6 3v2h8V3M5 5v12h10V5M9 10l2 2 4-4', getHref: (id) => `/decision-models/${id}/recommendation/evaluations` },
  { label: 'Hasil', icon: 'M10 3l2.5 5.2L18 9l-4 3.8 1 5.2-5-2.8-5 2.8 1-5.2L2 9l5.5-.8z', getHref: (id) => `/decision-models/${id}/recommendation/results` },
]

export function WorkspaceSidebar({ segment, open, collapsed, onClose, pathname }) {
  const decisionModelId = useDecisionModelId()
  const navigate = useNavigate()
  const decisionModelQuery = useDecisionModel(decisionModelId)
  const decisionModelName = decisionModelQuery.data?.name || 'Program terpilih'

  const isRecommendation = segment === 'recommendation'
  const navItems = isRecommendation ? RECOMMENDATION_NAV : WORKSHOP_NAV
  const sectionLabel = isRecommendation ? 'Rekomendasi' : 'Workshop'
  const description = isRecommendation ? 'Alur rekomendasi' : 'Ruang kerja program'

  return (
    <>
      <button type="button" className={`sidebar-backdrop ${open ? 'visible' : ''}`} aria-label="Tutup navigasi" onClick={onClose} />
      <aside className={`app-sidebar workspace-sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar-brand-row">
          <div className="sidebar-brand-block">
            <span className="brand-mark">DSS</span>
            <div className="sidebar-brand-copy">
              <strong>{decisionModelName}</strong>
              <p>{description}</p>
            </div>
          </div>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Tutup menu">
            <MenuIcon />
          </button>
        </div>

        <button type="button" className="sidebar-back-link" onClick={() => navigate('/decision-models')}>
          <span className="sidebar-link-icon" aria-hidden="true"><BackIcon /></span>
          <span className="sidebar-link-copy">
            <span className="sidebar-link-label">Kembali ke program</span>
          </span>
        </button>

        <div className="sidebar-scrollable">
          <div className="workspace-primary-nav">
            <div className="sidebar-nav-section-label">{sectionLabel}</div>
            {navItems.map((item) => (
              <NavLink key={item.label} to={item.getHref(decisionModelId)} onClick={onClose} className={({ isActive }) => `workspace-primary-link ${isActive ? 'active' : ''}`}>
                <span className="sidebar-link-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" className="sidebar-nav-icon">
                    <path d={item.icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="workspace-primary-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}
