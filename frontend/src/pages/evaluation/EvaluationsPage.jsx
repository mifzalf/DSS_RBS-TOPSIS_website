import { useState } from 'react'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressIndicator } from '../../components/ui/ProgressIndicator'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAlternatives } from '../../features/alternative/useAlternatives'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { useEvaluationOverview } from '../../features/evaluation/useEvaluationOverview'
import { useCreateEvaluation, useDeleteEvaluation, useUpdateEvaluation } from '../../features/evaluation/useEvaluations'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

export function EvaluationsPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [selectedAlternativeId, setSelectedAlternativeId] = useState(null)
  const criteriaQuery = useCriteriaWithSubCriteria(decisionModelId)
  const alternativesQuery = useAlternatives(decisionModelId)
  const overview = useEvaluationOverview(alternativesQuery.data || [], criteriaQuery.data || [])
  const selectedId = selectedAlternativeId || alternativesQuery.data?.[0]?.id
  const selectedAlternative = (alternativesQuery.data || []).find((item) => item.id === selectedId)
  const selectedOverview = (overview.data || []).find((item) => item.id === selectedId)
  const createMutation = useCreateEvaluation(selectedId)
  const updateMutation = useUpdateEvaluation(selectedId)
  const deleteMutation = useDeleteEvaluation(selectedId)

  if (criteriaQuery.isLoading || alternativesQuery.isLoading || overview.isLoading) {
    return <LoadingState title="Loading evaluation matrix" description="Calculating completeness across alternatives and criteria." />
  }

  if (criteriaQuery.error || alternativesQuery.error) {
    return <ErrorState description={criteriaQuery.error?.message || alternativesQuery.error?.message} onAction={() => { criteriaQuery.refetch(); alternativesQuery.refetch() }} />
  }

  const criteria = criteriaQuery.data || []
  const rows = overview.data || []
  const totalCompleted = rows.reduce((sum, row) => sum + row.completed, 0)
  const totalExpected = rows.reduce((sum, row) => sum + row.expected, 0)
  const completeness = totalExpected ? Math.round((totalCompleted / totalExpected) * 100) : 0
  const evaluationsByCriteria = new Map((selectedOverview?.evaluations || []).map((item) => [item.criteria_id, item]))

  const handleSelectSubCriteria = async (criteriaItem, subCriteriaId) => {
    const existing = evaluationsByCriteria.get(criteriaItem.id)

    try {
      if (!subCriteriaId) {
        if (existing) {
          await deleteMutation.mutateAsync(existing.id)
          pushToast({ title: 'Evaluation removed', description: `${criteriaItem.name} has been cleared.`, tone: 'success' })
        }
        return
      }

      const payload = {
        alternative_id: selectedId,
        criteria_id: criteriaItem.id,
        sub_criteria_id: Number(subCriteriaId),
      }

      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, payload: { sub_criteria_id: Number(subCriteriaId) } })
        pushToast({ title: 'Evaluation updated', description: `${criteriaItem.name} has been updated.`, tone: 'success' })
      } else {
        await createMutation.mutateAsync(payload)
        pushToast({ title: 'Evaluation created', description: `${criteriaItem.name} has been recorded.`, tone: 'success' })
      }
    } catch (submitError) {
      pushToast({ title: 'Evaluation request failed', description: submitError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="TOPSIS Evaluations" />
      <PageHeader eyebrow="TOPSIS Evaluations" title="Use a matrix mindset so scoring feels structured instead of repetitive." description="Select one alternative and assign one sub-criteria value for each weighted criterion." />
      <div className="content-grid two-column">
        <SectionCard title="Completeness" description="Shows how close the model is to a recommendation-ready evaluation set.">
          <ProgressIndicator value={completeness} label="Evaluation coverage" hint={`${totalCompleted} filled cells out of ${totalExpected} expected cells.`} tone={completeness === 100 ? 'success' : 'warning'} />
          <div className="alternative-chip-list">
            {(alternativesQuery.data || []).map((alternative) => (
              <button key={alternative.id} type="button" className={`decision-model-tab ${selectedId === alternative.id ? 'active' : ''}`} onClick={() => setSelectedAlternativeId(alternative.id)}>
                {alternative.name}
              </button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Matrix readiness" description="Review fill counts per alternative before opening the row editor below.">
          <div className="rule-condition-list">
            {rows.map((row) => (
              <div key={row.id} className="rule-condition-item">
                <strong>{row.name}</strong>
                <span>{row.completed}/{row.expected} filled</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={selectedAlternative ? `Edit matrix for ${selectedAlternative.name}` : 'Evaluation matrix'} description="Each criteria row supports create, update, or clear for the selected alternative.">
        <div className="evaluation-row-list">
          {criteria.map((criteriaItem) => {
            const existing = evaluationsByCriteria.get(criteriaItem.id)
            const selectedValue = existing?.sub_criteria_id ? String(existing.sub_criteria_id) : ''

            return (
              <article key={criteriaItem.id} className="rule-evaluation-card">
                <div>
                  <strong>{criteriaItem.code || 'C'} - {criteriaItem.name}</strong>
                  <p>{criteriaItem.type} · weight {criteriaItem.weight}</p>
                </div>
                <select className="input" value={selectedValue} onChange={(event) => handleSelectSubCriteria(criteriaItem, event.target.value)}>
                  <option value="">Select sub-criteria</option>
                  {criteriaItem.subCriteria.map((subCriteria) => (
                    <option key={subCriteria.id} value={subCriteria.id}>{subCriteria.label} (value {subCriteria.value})</option>
                  ))}
                </select>
                <div className="rule-evaluation-card-actions">
                  <span className={`badge ${existing ? 'badge-success' : 'badge-neutral'}`}>{existing ? 'filled' : 'empty'}</span>
                  <Button type="button" variant="ghost" disabled={!existing || deleteMutation.isPending} onClick={() => handleSelectSubCriteria(criteriaItem, '')}>Clear</Button>
                </div>
              </article>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
