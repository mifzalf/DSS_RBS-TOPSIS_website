import { Link, useLocation } from 'react-router-dom'
import { useDecisionModel } from '../../features/decision-model/useDecisionModels'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const links = [
  { label: 'Overview', getHref: (id) => `/decision-models/${id}` },
  { label: 'Members', getHref: (id) => `/decision-models/${id}/members` },
  { label: 'Assessment factors', getHref: (id) => `/decision-models/${id}/criteria` },
  { label: 'Households', getHref: (id) => `/decision-models/${id}/alternatives` },
  { label: 'Assessment answers', getHref: (id) => `/decision-models/${id}/evaluations` },
  { label: 'Eligibility indicators', getHref: (id) => `/decision-models/${id}/rule-variables` },
  { label: 'Eligibility answers', getHref: (id) => `/decision-models/${id}/rule-evaluations` },
  { label: 'Assistance rules', getHref: (id) => `/decision-models/${id}/rules` },
  { label: 'Recommendations', getHref: (id) => `/decision-models/${id}/recommendation` },
]

export function DecisionModelPageNav({ currentLabel }) {
  const decisionModelId = useDecisionModelId()
  const { pathname } = useLocation()
  const decisionModelQuery = useDecisionModel(decisionModelId)
  const decisionModelName = decisionModelQuery.data?.name || 'Selected program'

  return (
    <div className="decision-model-page-nav surface-panel">
      <div className="decision-model-page-nav-head">
        <div className="decision-model-breadcrumbs">
          <Link to="/decision-models">Programs</Link>
          <span>{decisionModelName}</span>
          <span>{currentLabel}</span>
        </div>
      </div>

      <nav className="decision-model-tab-nav">
        {links.map((link) => {
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
  )
}
