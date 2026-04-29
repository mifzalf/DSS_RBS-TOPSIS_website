import { Link, useLocation } from 'react-router-dom'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const STEPS = [
  { key: 'alternatives', label: 'Alternatif', description: 'Daftar rumah tangga atau kandidat yang akan dinilai.' },
  { key: 'evaluations', label: 'Evaluasi', description: 'Isi jawaban TOPSIS dan fakta RBS untuk setiap alternatif.' },
  { key: 'results', label: 'Hasil', description: 'Lihat rekomendasi akhir dan prioritas setiap grup bantuan.' },
]

export function RecommendationFlowNav() {
  const decisionModelId = useDecisionModelId()
  const { pathname } = useLocation()

  const currentStepIndex = STEPS.findIndex((step) => {
    const expectedPath = `/decision-models/${decisionModelId}/recommendation/${step.key}`
    return pathname === expectedPath || pathname.startsWith(expectedPath)
  })

  return (
    <nav className="recommendation-flow-nav">
      {STEPS.map((step, index) => {
        const isActive = index === currentStepIndex
        const isCompleted = index < currentStepIndex

        return (
          <Link
            key={step.key}
            to={`/decision-models/${decisionModelId}/recommendation/${step.key}`}
            className={`recommendation-flow-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <span className="recommendation-flow-step-number">{isCompleted ? '✓' : index + 1}</span>
            <span className="recommendation-flow-step-label">{step.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
