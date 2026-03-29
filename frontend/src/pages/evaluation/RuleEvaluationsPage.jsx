import { useState } from 'react'
import { useFeedback } from '../../app/providers/useFeedback'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAlternatives } from '../../features/alternative/useAlternatives'
import { useDeleteRuleEvaluation, useRuleEvaluations, useUpsertRuleEvaluation } from '../../features/rule-evaluation/useRuleEvaluations'
import { useRuleVariables } from '../../features/rule-variable/useRuleVariables'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

function getInitialValue(variable) {
  if (variable.value_type === 'boolean') return 'false'
  return ''
}

function getPayload(variable, alternativeId, rawValue) {
  const payload = {
    alternative_id: alternativeId,
    rule_variable_id: variable.id,
    value_boolean: undefined,
    value_number: undefined,
    value_string: undefined,
  }

  if (variable.value_type === 'boolean') payload.value_boolean = rawValue === 'true'
  if (variable.value_type === 'number') payload.value_number = rawValue === '' ? null : Number(rawValue)
  if (variable.value_type === 'string') payload.value_string = rawValue

  return payload
}

function readValue(evaluation, variable) {
  if (!evaluation) return getInitialValue(variable)
  if (variable.value_type === 'boolean') return String(Boolean(evaluation.value_boolean))
  if (variable.value_type === 'number') return evaluation.value_number ?? ''
  return evaluation.value_string ?? ''
}

export function RuleEvaluationsPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [selectedAlternativeId, setSelectedAlternativeId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const alternativesQuery = useAlternatives(decisionModelId)
  const variablesQuery = useRuleVariables(decisionModelId)
  const alternatives = alternativesQuery.data || []
  const selectedId = selectedAlternativeId || alternatives[0]?.id
  const evaluationsQuery = useRuleEvaluations(selectedId)
  const upsertMutation = useUpsertRuleEvaluation(selectedId)
  const deleteMutation = useDeleteRuleEvaluation(selectedId)

  if (alternativesQuery.isLoading || variablesQuery.isLoading || (selectedId && evaluationsQuery.isLoading)) {
    return <LoadingState title="Loading rule evaluations" description="Preparing alternatives and typed fact values for RBS input." />
  }

  if (alternativesQuery.error || variablesQuery.error || evaluationsQuery.error) {
    return <ErrorState description={alternativesQuery.error?.message || variablesQuery.error?.message || evaluationsQuery.error?.message} onAction={() => { alternativesQuery.refetch(); variablesQuery.refetch(); evaluationsQuery.refetch?.() }} />
  }

  const variables = variablesQuery.data || []
  const evaluations = evaluationsQuery.data || []
  const evaluationsByVariable = new Map(evaluations.map((item) => [item.rule_variable_id, item]))

  const saveValue = async (variable) => {
    const currentEvaluation = evaluationsByVariable.get(variable.id)
    const rawValue = drafts[variable.id] ?? readValue(currentEvaluation, variable)

    try {
      await upsertMutation.mutateAsync({
        id: currentEvaluation?.id,
        payload: currentEvaluation?.id ? getPayload(variable, selectedId, rawValue) : getPayload(variable, selectedId, rawValue),
      })
      pushToast({ title: 'Rule evaluation saved', description: `${variable.name} has been updated for the selected alternative.`, tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Failed to save rule evaluation', description: error.message, tone: 'error' })
    }
  }

  const clearValue = async (variable) => {
    const currentEvaluation = evaluationsByVariable.get(variable.id)
    if (!currentEvaluation) return
    try {
      await deleteMutation.mutateAsync(currentEvaluation.id)
      pushToast({ title: 'Rule evaluation removed', description: `${variable.name} has been cleared for the selected alternative.`, tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Failed to remove rule evaluation', description: error.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Rule Evaluations" />
      <PageHeader eyebrow="Rule Evaluations" title="Fill RBS facts separately from TOPSIS scoring to keep the workflow readable." description="Choose one alternative, then assign typed fact values for each rule variable. Boolean, number, and string inputs are rendered automatically." />
      <SectionCard title="Alternative selector" description="Rule evaluations are entered per alternative so classification facts stay isolated from TOPSIS scoring.">
        {alternatives.length ? (
          <div className="alternative-chip-list">
            {alternatives.map((alternative) => (
              <button key={alternative.id} type="button" className={`decision-model-tab ${selectedId === alternative.id ? 'active' : ''}`} onClick={() => setSelectedAlternativeId(alternative.id)}>
                {alternative.name}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No alternatives available" description="Create alternatives before filling rule evaluations." />
        )}
      </SectionCard>
      <SectionCard title="Typed fact matrix" description="Each row writes or updates one rule evaluation for the selected alternative.">
        {variables.length ? (
          <div className="rule-evaluation-grid">
            {variables.map((variable) => {
              const currentEvaluation = evaluationsByVariable.get(variable.id)
              const currentValue = drafts[variable.id] ?? readValue(currentEvaluation, variable)

              return (
                <article key={variable.id} className="rule-evaluation-card">
                  <div>
                    <strong>{variable.code} - {variable.name}</strong>
                    <p>{variable.description || 'No description provided.'}</p>
                  </div>
                  <span className="badge badge-info">{variable.value_type}</span>
                  {variable.value_type === 'boolean' ? (
                    <select className="input" value={currentValue} onChange={(event) => setDrafts((state) => ({ ...state, [variable.id]: event.target.value }))}>
                      <option value="false">False</option>
                      <option value="true">True</option>
                    </select>
                  ) : variable.value_type === 'number' ? (
                    <input className="input" type="number" value={currentValue} onChange={(event) => setDrafts((state) => ({ ...state, [variable.id]: event.target.value }))} placeholder="Enter number value" />
                  ) : (
                    <input className="input" value={currentValue} onChange={(event) => setDrafts((state) => ({ ...state, [variable.id]: event.target.value }))} placeholder="Enter string value" />
                  )}
                  <div className="rule-evaluation-card-actions">
                    <Button type="button" variant="secondary" onClick={() => saveValue(variable)} disabled={upsertMutation.isPending}>Save value</Button>
                    <Button type="button" variant="ghost" onClick={() => clearValue(variable)} disabled={!currentEvaluation || deleteMutation.isPending}>Clear</Button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState title="No rule variables yet" description="Create rule variables first so the matrix can render typed inputs." />
        )}
      </SectionCard>
    </div>
  )
}
