import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressIndicator } from '../../components/ui/ProgressIndicator'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAlternatives } from '../../features/alternative/useAlternatives'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { useEvaluationOverview } from '../../features/evaluation/useEvaluationOverview'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

export function EvaluationsPage() {
  const decisionModelId = useDecisionModelId()
  const criteriaQuery = useCriteriaWithSubCriteria(decisionModelId)
  const alternativesQuery = useAlternatives(decisionModelId)
  const overview = useEvaluationOverview(alternativesQuery.data || [], criteriaQuery.data || [])

  if (criteriaQuery.isLoading || alternativesQuery.isLoading || overview.isLoading) {
    return <LoadingState title="Loading evaluation matrix" description="Calculating completeness across alternatives and criteria." />
  }

  if (criteriaQuery.error || alternativesQuery.error) {
    return <ErrorState description={criteriaQuery.error?.message || alternativesQuery.error?.message} onAction={() => { criteriaQuery.refetch(); alternativesQuery.refetch() }} />
  }

  const rows = overview.data || []
  const totalCompleted = rows.reduce((sum, row) => sum + row.completed, 0)
  const totalExpected = rows.reduce((sum, row) => sum + row.expected, 0)
  const completeness = totalExpected ? Math.round((totalCompleted / totalExpected) * 100) : 0

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Evaluations" />
      <PageHeader eyebrow="Evaluations" title="Use a matrix mindset so scoring feels structured instead of repetitive." description="This foundation already tracks completeness per alternative and can evolve into full matrix editing with conditional sub-criteria selection." />
      <div className="content-grid two-column">
        <SectionCard title="Completeness" description="Shows how close the model is to a recommendation-ready evaluation set.">
          <ProgressIndicator value={completeness} label="Evaluation coverage" hint={`${totalCompleted} filled cells out of ${totalExpected} expected cells.`} tone={completeness === 100 ? 'success' : 'warning'} />
        </SectionCard>
        <SectionCard title="Matrix readiness" description="Each row can later open inline editors for criteria-specific sub-criteria values.">
          <DataTable
            columns={[
              { key: 'name', header: 'Alternative' },
              { key: 'completed', header: 'Filled' },
              { key: 'expected', header: 'Expected' },
              { key: 'status', header: 'Status', render: (row) => (row.completed === row.expected ? 'Complete' : 'In progress') },
            ]}
            rows={rows}
          />
        </SectionCard>
      </div>
    </div>
  )
}
