import { Link, useLocation } from 'react-router-dom'
import { useDecisionModel } from '../../features/decision-model/useDecisionModels'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const NAV_GROUPS = [
  {
    key: 'general',
    label: 'General',
    links: [
      { label: 'Overview', getHref: (id) => `/decision-models/${id}` },
      { label: 'Members', getHref: (id) => `/decision-models/${id}/members` },
      { label: 'Assistance categories', getHref: (id) => `/decision-models/${id}/assistance-categories` },
      { label: 'Grade policies', getHref: (id) => `/decision-models/${id}/grade-policies` },
      { label: 'Recommendations', getHref: (id) => `/decision-models/${id}/recommendation` },
    ],
  },
  {
    key: 'topsis',
    label: 'TOPSIS',
    links: [
      { label: 'Criteria', getHref: (id) => `/decision-models/${id}/criteria` },
    ],
  },
  {
    key: 'rulebase',
    label: 'Rule Base',
    links: [
      { label: 'Rules', getHref: (id) => `/decision-models/${id}/rules` },
    ],
  },
  {
    key: 'alternatives',
    label: 'Alternatives',
    links: [
      { label: 'Alternatives', getHref: (id) => `/decision-models/${id}/alternatives` },
      { label: 'TOPSIS evaluations', getHref: (id) => `/decision-models/${id}/evaluations` },
      { label: 'Rule evaluations', getHref: (id) => `/decision-models/${id}/rule-evaluations` },
    ],
  },
]

function getActiveGroup(pathname, decisionModelId) {
  for (const group of NAV_GROUPS) {
    if (group.links.some((link) => pathname === link.getHref(decisionModelId))) {
      return group.key
    }
  }

  return 'general'
}

export function DecisionModelPageNav({ currentLabel }) {
  const decisionModelId = useDecisionModelId()
  const { pathname } = useLocation()
  const decisionModelQuery = useDecisionModel(decisionModelId)
  const decisionModelName = decisionModelQuery.data?.name || 'Selected program'
  const activeGroupKey = getActiveGroup(pathname, decisionModelId)
  const activeGroup = NAV_GROUPS.find((group) => group.key === activeGroupKey) || NAV_GROUPS[0]

  return (
    <div className="decision-model-page-nav surface-panel">
      <div className="decision-model-page-nav-head">
        <div className="decision-model-breadcrumbs">
          <Link to="/decision-models">Programs</Link>
          <span>{decisionModelName}</span>
          <span>{currentLabel}</span>
        </div>
      </div>

      <div className="decision-model-group-switcher" role="tablist" aria-label="Workspace group switcher">
        {NAV_GROUPS.map((group) => {
          const firstHref = group.links[0].getHref(decisionModelId)
          const isActive = group.key === activeGroupKey

          return (
            <Link key={group.key} to={firstHref} className={`decision-model-group-tab ${isActive ? 'active' : ''}`}>
              {group.label}
            </Link>
          )
        })}
      </div>

      <div className="decision-model-subnav-wrap">
        <span className="decision-model-subnav-label">{activeGroup.label}</span>
        <nav className="decision-model-tab-nav">
          {activeGroup.links.map((link) => {
            const href = link.getHref(decisionModelId)
            const isActive = pathname === href

            return (
              <Link key={link.label} to={href} className={`decision-model-tab ${isActive ? 'active' : ''}`}>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
