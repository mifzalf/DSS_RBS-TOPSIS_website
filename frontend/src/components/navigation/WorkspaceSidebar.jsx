import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useDecisionModel } from '../../features/decision-model/useDecisionModels'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="menu-toggle-icon">
      <path d="M4 6h12M4 10h12M4 14h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function GeneralIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="sidebar-nav-icon">
      <rect x="4" y="4" width="12" height="12" rx="2" />
      <path d="M7 8h6M7 12h4" />
    </svg>
  )
}

function AlternativesIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="sidebar-nav-icon">
      <path d="M5 5.5h10M5 10h10M5 14.5h10" />
      <circle cx="5" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CriteriaIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="sidebar-nav-icon">
      <path d="M6 4.5 4.5 6v8l1.5 1.5h8L15.5 14V6L14 4.5Z" />
      <path d="M8 8.5h4M8 11.5h4" />
    </svg>
  )
}

function RuleBaseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="sidebar-nav-icon">
      <path d="M6 6.5h8M6 10h8M6 13.5h5" />
      <rect x="4" y="4" width="12" height="12" rx="2" />
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

function ChevronIcon({ expanded }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`sidebar-chevron ${expanded ? 'expanded' : ''}`}>
      <path d="M7 6.5 12 10l-5 3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PRIMARY_NAV = [
  {
    key: 'general',
    label: 'General',
    icon: <GeneralIcon />,
    expandable: true,
    children: [
      { label: 'Overview', getHref: (id) => `/decision-models/${id}` },
      { label: 'Members', getHref: (id) => `/decision-models/${id}/members` },
      { label: 'Assistance categories', getHref: (id) => `/decision-models/${id}/assistance-categories` },
      { label: 'Grade policies', getHref: (id) => `/decision-models/${id}/grade-policies` },
      { label: 'Recommendations', getHref: (id) => `/decision-models/${id}/recommendation` },
    ],
  },
  {
    key: 'alternatives',
    label: 'Alternatives',
    icon: <AlternativesIcon />,
    expandable: true,
    children: [
      { label: 'Alternatives', getHref: (id) => `/decision-models/${id}/alternatives` },
      { label: 'TOPSIS evaluations', getHref: (id) => `/decision-models/${id}/evaluations` },
      { label: 'Rule evaluations', getHref: (id) => `/decision-models/${id}/rule-evaluations` },
    ],
  },
  {
    key: 'criteria',
    label: 'Criteria',
    icon: <CriteriaIcon />,
    expandable: false,
    getHref: (id) => `/decision-models/${id}/criteria`,
  },
  {
    key: 'rulebase',
    label: 'Rule Base',
    icon: <RuleBaseIcon />,
    expandable: false,
    getHref: (id) => `/decision-models/${id}/rules`,
  },
]

function isPrimaryActive(item, pathname, decisionModelId) {
  if (item.expandable) {
    return item.children.some((child) => pathname === child.getHref(decisionModelId))
  }
  return pathname === item.getHref(decisionModelId)
}

export function WorkspaceSidebar({ open, collapsed, onClose, pathname }) {
  const decisionModelId = useDecisionModelId()
  const navigate = useNavigate()
  const decisionModelQuery = useDecisionModel(decisionModelId)
  const decisionModelName = decisionModelQuery.data?.name || 'Selected program'
  const [expandedGroup, setExpandedGroup] = useState(() => {
    const matched = PRIMARY_NAV.find((item) => item.expandable && item.children.some((child) => pathname === child.getHref(decisionModelId)))
    return matched?.key || 'general'
  })

  return (
    <>
      <button type="button" className={`sidebar-backdrop ${open ? 'visible' : ''}`} aria-label="Close navigation" onClick={onClose} />
      <aside className={`app-sidebar workspace-sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar-brand-row">
          <div className="sidebar-brand-block">
            <span className="brand-mark">DSS</span>
            <div className="sidebar-brand-copy">
              <strong>{decisionModelName}</strong>
              <p>Program workspace</p>
            </div>
          </div>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <MenuIcon />
          </button>
        </div>

        <button type="button" className="sidebar-back-link" onClick={() => navigate('/decision-models')}>
          <span className="sidebar-link-icon" aria-hidden="true"><BackIcon /></span>
          <span className="sidebar-link-copy">
            <span className="sidebar-link-label">Back to programs</span>
          </span>
        </button>

        <div className="sidebar-scrollable">
          <div className="workspace-primary-nav">
            {PRIMARY_NAV.map((item) => {
              const active = isPrimaryActive(item, pathname, decisionModelId)

              if (!item.expandable) {
                return (
                  <NavLink key={item.key} to={item.getHref(decisionModelId)} onClick={onClose} className={({ isActive }) => `workspace-primary-link ${isActive ? 'active' : ''}`}>
                    <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
                    <span className="workspace-primary-label">{item.label}</span>
                  </NavLink>
                )
              }

              const expanded = expandedGroup === item.key

              return (
                <div key={item.key} className={`workspace-nav-group ${active ? 'active' : ''}`}>
                  <button type="button" className={`workspace-primary-link ${active ? 'active' : ''}`} onClick={() => setExpandedGroup((current) => (current === item.key ? '' : item.key))}>
                    <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
                    <span className="workspace-primary-label">{item.label}</span>
                    <span className="workspace-primary-meta"><ChevronIcon expanded={expanded} /></span>
                  </button>
                  {expanded ? (
                    <div className="workspace-subnav">
                      {item.children.map((child) => (
                        <NavLink key={child.label} to={child.getHref(decisionModelId)} onClick={onClose} className={({ isActive }) => `workspace-subnav-link ${isActive ? 'active' : ''}`}>
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </aside>
    </>
  )
}
