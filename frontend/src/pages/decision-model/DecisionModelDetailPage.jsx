import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { StatusBadge } from '../../components/navigation/StatusBadge'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressIndicator } from '../../components/ui/ProgressIndicator'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { useAlternatives } from '../../features/alternative/useAlternatives'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { decisionModelSchema } from '../../features/decision-model/decisionModel.schema'
import { useDeleteDecisionModel, useDecisionModel, useUpdateDecisionModel } from '../../features/decision-model/useDecisionModels'
import { useEvaluationOverview } from '../../features/evaluation/useEvaluationOverview'
import { useRulesWithConditions } from '../../features/rule/useRules'
import { useResults } from '../../features/result/useResults'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { formatPercent } from '../../utils/format'

export function DecisionModelDetailPage() {
  const decisionModelId = useDecisionModelId()
  const navigate = useNavigate()
  const { pushToast } = useFeedback()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const modelQuery = useDecisionModel(decisionModelId)
  const updateMutation = useUpdateDecisionModel()
  const deleteMutation = useDeleteDecisionModel()
  const criteriaQuery = useCriteriaWithSubCriteria(decisionModelId)
  const alternativesQuery = useAlternatives(decisionModelId)
  const rulesQuery = useRulesWithConditions(decisionModelId)
  const resultsQuery = useResults(decisionModelId)
  const evaluationOverview = useEvaluationOverview(alternativesQuery.data || [], criteriaQuery.data || [])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(decisionModelSchema),
    defaultValues: { name: '', descriptions: '' },
  })

  if (modelQuery.isLoading || criteriaQuery.isLoading || alternativesQuery.isLoading || rulesQuery.isLoading || resultsQuery.isLoading || evaluationOverview.isLoading) {
    return <LoadingState title="Loading model overview" description="Mapping the current workflow readiness for this decision model." />
  }

  if (modelQuery.error) {
    return <ErrorState description={modelQuery.error.message} onAction={modelQuery.refetch} />
  }

  const model = modelQuery.data
  const criteria = criteriaQuery.data || []
  const alternatives = alternativesQuery.data || []
  const rules = rulesQuery.data || []
  const results = resultsQuery.data || []
  const evaluations = evaluationOverview.data || []
  const completedEvaluationCells = evaluations.reduce((sum, row) => sum + row.completed, 0)
  const expectedEvaluationCells = evaluations.reduce((sum, row) => sum + row.expected, 0)
  const evaluationProgress = expectedEvaluationCells ? Math.round((completedEvaluationCells / expectedEvaluationCells) * 100) : 0
  const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  const sections = [
    { label: 'Criteria', href: `/decision-models/${decisionModelId}/criteria`, count: criteria.length, status: criteria.length ? 'ready' : 'pending' },
    { label: 'Alternatives', href: `/decision-models/${decisionModelId}/alternatives`, count: alternatives.length, status: alternatives.length ? 'ready' : 'pending' },
    { label: 'Evaluations', href: `/decision-models/${decisionModelId}/evaluations`, count: `${completedEvaluationCells}/${expectedEvaluationCells}`, status: evaluationProgress === 100 ? 'ready' : evaluationProgress > 0 ? 'warning' : 'pending' },
    { label: 'Rules', href: `/decision-models/${decisionModelId}/rules`, count: rules.length, status: rules.length ? 'ready' : 'pending' },
    { label: 'Results', href: `/decision-models/${decisionModelId}/results`, count: results.length, status: results.length ? 'ready' : 'pending' },
  ]

  const openEditModal = () => {
    reset({ name: model.name || '', descriptions: model.descriptions || '' })
    setEditOpen(true)
  }

  const handleUpdate = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ id: decisionModelId, payload: values })
      pushToast({ title: 'Decision model updated', description: 'Workspace information has been refreshed.', tone: 'success' })
      setEditOpen(false)
    } catch (error) {
      pushToast({ title: 'Failed to update model', description: error.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(decisionModelId)
      pushToast({ title: 'Decision model deleted', description: 'The workspace has been removed.', tone: 'success' })
      navigate('/decision-models')
    } catch (error) {
      pushToast({ title: 'Failed to delete model', description: error.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Overview" />
      <PageHeader
        eyebrow="Decision Model"
        title={model.name}
        description={model.descriptions || 'This model has not received a description yet.'}
        actions={
          <div className="decision-model-page-actions">
            <ActionMenu
              items={[
                { label: 'Edit', onSelect: openEditModal },
                { label: 'Delete', tone: 'danger', onSelect: () => setDeleteOpen(true) },
              ]}
              align="left"
            />
            <Link className="button button-secondary" to={`/decision-models/${decisionModelId}/recommendation`}>
              Open recommendation
            </Link>
          </div>
        }
      />

      <section className="stats-grid">
        <StatCard label="Criteria count" value={criteria.length} hint={`Weight total ${formatPercent(totalWeight)}`} />
        <StatCard label="Alternative count" value={alternatives.length} hint="Evaluation candidates in this model." />
        <StatCard label="Rule count" value={rules.length} hint="Business conditions currently applied." />
        <StatCard label="Recommendation status" value={results.length ? 'Generated' : 'Pending'} hint="Final result availability." tone={results.length ? 'accent' : 'default'} />
      </section>

      <div className="content-grid two-column">
        <SectionCard title="Progress panel" description="Shows where the team should continue next in the workflow.">
          <div className="stack-lg">
            <ProgressIndicator value={Math.min(100, Math.round(((criteria.length > 0) + (alternatives.length > 0) + (rules.length > 0) + (results.length > 0)) * 25 + evaluationProgress * 0.25))} label="Overall model readiness" hint="Combines foundational setup and evaluation completeness." tone="accent" />
            <ProgressIndicator value={evaluationProgress} label="Evaluation completeness" hint={`${completedEvaluationCells} of ${expectedEvaluationCells} expected cells are filled.`} tone={evaluationProgress === 100 ? 'success' : 'warning'} />
            <ProgressIndicator value={Math.round(Math.min(totalWeight, 1) * 100)} label="Criteria weight balance" hint={totalWeight === 1 ? 'Total weight is ideal.' : 'Weight total should reach exactly 100%.'} tone={totalWeight === 1 ? 'success' : 'warning'} />
          </div>
        </SectionCard>

        <SectionCard title="Workflow links" description="Navigate by domain, not by disconnected forms.">
          <div className="link-list">
            {sections.map((section) => (
              <Link key={section.label} to={section.href} className="workflow-link">
                <div>
                  <strong>{section.label}</strong>
                  <p>{section.count}</p>
                </div>
                <StatusBadge status={section.status} />
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <Modal
        open={editOpen}
        title="Edit decision model"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="detail-decision-model-form" disabled={isSubmitting || updateMutation.isPending}>
              Save changes
            </Button>
          </>
        }
      >
        <form id="detail-decision-model-form" className="stack-md" onSubmit={handleUpdate}>
          <FormField label="Model name" error={errors.name?.message}>
            <TextField placeholder="Scholarship selection 2026" {...register('name')} />
          </FormField>
          <FormField label="Description" hint="Optional context for the evaluation objective." error={errors.descriptions?.message}>
            <textarea className="input textarea" rows="4" placeholder="Explain what decision this model will support." {...register('descriptions')} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete decision model"
        description={`Delete ${model.name}? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete model'}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
