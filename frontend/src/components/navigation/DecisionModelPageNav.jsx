import { Link, useLocation } from 'react-router-dom'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const links = [
  { label: 'Overview', getHref: (id) => `/decision-models/${id}` },
  { label: 'Members', getHref: (id) => `/decision-models/${id}/members` },
  { label: 'Criteria', getHref: (id) => `/decision-models/${id}/criteria` },
  { label: 'Alternatives', getHref: (id) => `/decision-models/${id}/alternatives` },
  { label: 'TOPSIS Evaluations', getHref: (id) => `/decision-models/${id}/evaluations` },
  { label: 'Rule Variables', getHref: (id) => `/decision-models/${id}/rule-variables` },
  { label: 'Rule Evaluations', getHref: (id) => `/decision-models/${id}/rule-evaluations` },
  { label: 'Rules', getHref: (id) => `/decision-models/${id}/rules` },
  { label: 'Results', getHref: (id) => `/decision-models/${id}/results` },
  { label: 'Recommendations', getHref: (id) => `/decision-models/${id}/recommendation` },
]

export function DecisionModelPageNav({ currentLabel }) {
  const decisionModelId = useDecisionModelId()
  const { pathname } = useLocation()

  return (
    <div className="decision-model-page-nav surface-panel">
      <div className="decision-model-page-nav-head">
        <div className="decision-model-breadcrumbs">
          <Link to="/decision-models">Decision models</Link>
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
