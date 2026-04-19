import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useFeedback } from '../../app/providers/useFeedback'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { FormField } from '../../components/form/FormField'
import { NumberField } from '../../components/form/NumberField'
import { TextField } from '../../components/form/TextField'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAssistanceCategories } from '../../features/assistance-categories/useAssistanceCategories'
import { useCreateGradePolicy, useDeleteGradePolicy, useGradePolicies, useUpdateGradePolicy } from '../../features/grade-policies/useGradePolicies'
import { useCreateGradeRange, useDeleteGradeRange, useUpdateGradeRange } from '../../features/grade-policies/useGradeRanges'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const policySchema = z.object({
  category_id: z.string().min(1, 'Category is required.'),
  applies_to_status: z.enum(['ranked', 'rejected']),
})

const rangeSchema = z.object({
  label: z.string().min(1, 'Label is required.').max(100, 'Maximum 100 characters.'),
  code: z.string().min(1, 'Code is required.').max(50, 'Maximum 50 characters.'),
  min_score: z.union([z.literal(''), z.coerce.number().min(0).max(1)]),
  max_score: z.union([z.literal(''), z.coerce.number().min(0).max(1)]),
  sort_order: z.coerce.number().int().min(1, 'Minimum sort order is 1.'),
})

export function GradePoliciesPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [policyModal, setPolicyModal] = useState({ open: false, policy: null })
  const [rangeModal, setRangeModal] = useState({ open: false, policy: null, range: null })
  const [deleteState, setDeleteState] = useState({ type: null, item: null })
  const { data = [], isLoading, error, refetch } = useGradePolicies(decisionModelId)
  const { data: categories = [] } = useAssistanceCategories(decisionModelId)
  const createPolicyMutation = useCreateGradePolicy(decisionModelId)
  const updatePolicyMutation = useUpdateGradePolicy(decisionModelId)
  const deletePolicyMutation = useDeleteGradePolicy(decisionModelId)
  const createRangeMutation = useCreateGradeRange(decisionModelId)
  const updateRangeMutation = useUpdateGradeRange(decisionModelId)
  const deleteRangeMutation = useDeleteGradeRange(decisionModelId)
  const policyForm = useForm({ resolver: zodResolver(policySchema), defaultValues: { category_id: '', applies_to_status: 'ranked' } })
  const rangeForm = useForm({ resolver: zodResolver(rangeSchema), defaultValues: { label: '', code: '', min_score: '', max_score: '', sort_order: 1 } })
  const gradePolicyCategoryValue = useWatch({ control: policyForm.control, name: 'category_id' })
  const gradePolicyStatusValue = useWatch({ control: policyForm.control, name: 'applies_to_status' })

  if (isLoading) {
    return <LoadingState title="Loading grade policies" description="Preparing grade policy scopes and range rules for this decision model." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  const openCreatePolicy = () => {
    policyForm.reset({ category_id: '', applies_to_status: 'ranked' })
    setPolicyModal({ open: true, policy: null })
  }

  const openEditPolicy = (policy) => {
    policyForm.reset({ category_id: String(policy.category_id || ''), applies_to_status: policy.applies_to_status })
    setPolicyModal({ open: true, policy })
  }

  const openCreateRange = (policy) => {
    rangeForm.reset({ label: '', code: '', min_score: '', max_score: '', sort_order: (policy.ranges?.length || 0) + 1 })
    setRangeModal({ open: true, policy, range: null })
  }

  const openEditRange = (policy, range) => {
    rangeForm.reset({ label: range.label, code: range.code, min_score: range.min_score ?? '', max_score: range.max_score ?? '', sort_order: range.sort_order })
    setRangeModal({ open: true, policy, range })
  }

  const submitPolicy = policyForm.handleSubmit(async (values) => {
    const payload = { decision_model_id: Number(decisionModelId), category_id: Number(values.category_id), applies_to_status: values.applies_to_status }
    try {
      if (policyModal.policy) {
        await updatePolicyMutation.mutateAsync({ id: policyModal.policy.id, payload })
        pushToast({ title: 'Grade policy updated', description: 'The grade policy scope has been refreshed.', tone: 'success' })
      } else {
        await createPolicyMutation.mutateAsync(payload)
        pushToast({ title: 'Grade policy created', description: 'A new grade policy scope has been added.', tone: 'success' })
      }
      setPolicyModal({ open: false, policy: null })
    } catch (submitError) {
      pushToast({ title: 'Grade policy request failed', description: submitError.message, tone: 'error' })
    }
  })

  const submitRange = rangeForm.handleSubmit(async (values) => {
    const payload = {
      result_grade_policy_id: rangeModal.policy.id,
      label: values.label,
      code: values.code,
      min_score: values.min_score === '' ? null : Number(values.min_score),
      max_score: values.max_score === '' ? null : Number(values.max_score),
      sort_order: Number(values.sort_order),
    }
    try {
      if (rangeModal.range) {
        await updateRangeMutation.mutateAsync({ id: rangeModal.range.id, payload })
        pushToast({ title: 'Grade range updated', description: 'The selected grade range has been refreshed.', tone: 'success' })
      } else {
        await createRangeMutation.mutateAsync(payload)
        pushToast({ title: 'Grade range created', description: 'A new score-to-grade mapping has been added.', tone: 'success' })
      }
      setRangeModal({ open: false, policy: null, range: null })
    } catch (submitError) {
      pushToast({ title: 'Grade range request failed', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      if (deleteState.type === 'policy') {
        await deletePolicyMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Grade policy deleted', description: 'The selected grade scope has been removed.', tone: 'success' })
      }
      if (deleteState.type === 'range') {
        await deleteRangeMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Grade range deleted', description: 'The selected range mapping has been removed.', tone: 'success' })
      }
      setDeleteState({ type: null, item: null })
    } catch (deleteError) {
      pushToast({ title: 'Delete request failed', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Grade Policies"
        title="Map ranked and rejected outcomes into formal grade labels."
        description="Create policy scopes per category and status, then define ordered score ranges such as high, medium, low priority, or not eligible."
        actions={<Button type="button" onClick={openCreatePolicy}>Add grade policy</Button>}
      />

      <SectionCard title="Policy catalog" description="Each policy targets one assistance category and one result status.">
        {data.length ? (
          <div className="grade-policy-list">
            {data.map((policy) => (
              <article key={policy.id} className="rule-card">
                <div className="rule-card-head">
                  <div>
                    <strong>{policy.categoryRef?.name || `Category #${policy.category_id}`}</strong>
                    <p>{policy.applies_to_status} outcomes</p>
                  </div>
                  <div className="rule-card-badges">
                    <Badge tone={policy.applies_to_status === 'ranked' ? 'success' : 'warning'}>{policy.applies_to_status}</Badge>
                    <ActionMenu items={[{ label: 'Add range', onSelect: () => openCreateRange(policy) }, { label: 'Edit policy', onSelect: () => openEditPolicy(policy) }, { label: 'Delete policy', tone: 'danger', onSelect: () => setDeleteState({ type: 'policy', item: policy }) }]} />
                  </div>
                </div>

                <div className="grade-range-list">
                  {policy.ranges?.length ? (
                    policy.ranges
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((range) => (
                        <div key={range.id} className="grade-range-item">
                          <div>
                            <strong>{range.label}</strong>
                            <p>{range.code}</p>
                          </div>
                          <div className="grade-range-meta">
                            <span>{range.min_score ?? '-'} to {range.max_score ?? '-'}</span>
                            <span>Order {range.sort_order}</span>
                          </div>
                          <ActionMenu items={[{ label: 'Edit range', onSelect: () => openEditRange(policy, range) }, { label: 'Delete range', tone: 'danger', onSelect: () => setDeleteState({ type: 'range', item: range }) }]} />
                        </div>
                      ))
                  ) : (
                    <EmptyState title="No ranges yet" description="Add ordered ranges so this policy can map scores to grades." actionLabel="Add range" onAction={() => openCreateRange(policy)} />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No grade policies configured" description="Start by creating a policy for a category and result status, then define its ranges." actionLabel="Add grade policy" onAction={openCreatePolicy} />
        )}
      </SectionCard>

      <Modal open={policyModal.open} title={policyModal.policy ? 'Edit grade policy' : 'Create grade policy'} onClose={() => setPolicyModal({ open: false, policy: null })} footer={<><Button type="button" variant="ghost" onClick={() => setPolicyModal({ open: false, policy: null })}>Cancel</Button><Button type="submit" form="grade-policy-form" disabled={policyForm.formState.isSubmitting || createPolicyMutation.isPending || updatePolicyMutation.isPending}>Save policy</Button></>}>
        <form id="grade-policy-form" className="stack-md" onSubmit={submitPolicy}>
          <FormField label="Category" error={policyForm.formState.errors.category_id?.message}><DropdownSelect value={gradePolicyCategoryValue} options={[{ value: '', label: 'Select category' }, ...categories.map((item) => ({ value: String(item.id), label: `${item.name} (${item.code})` }))]} onChange={(value) => policyForm.setValue('category_id', value, { shouldValidate: true })} /></FormField>
          <FormField label="Applies to status" error={policyForm.formState.errors.applies_to_status?.message}><DropdownSelect value={gradePolicyStatusValue} options={[{ value: 'ranked', label: 'Ranked' }, { value: 'rejected', label: 'Rejected' }]} onChange={(value) => policyForm.setValue('applies_to_status', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <Modal open={rangeModal.open} title={rangeModal.range ? `Edit range for ${rangeModal.policy?.categoryRef?.name || 'selected category'}` : `Add range to ${rangeModal.policy?.categoryRef?.name || 'selected category'}`} onClose={() => setRangeModal({ open: false, policy: null, range: null })} footer={<><Button type="button" variant="ghost" onClick={() => setRangeModal({ open: false, policy: null, range: null })}>Cancel</Button><Button type="submit" form="grade-range-form" disabled={rangeForm.formState.isSubmitting || createRangeMutation.isPending || updateRangeMutation.isPending}>Save range</Button></>}>
        <form id="grade-range-form" className="stack-md" onSubmit={submitRange}>
          <FormField label="Label" error={rangeForm.formState.errors.label?.message}><TextField {...rangeForm.register('label')} placeholder="High priority" /></FormField>
          <FormField label="Code" error={rangeForm.formState.errors.code?.message}><TextField {...rangeForm.register('code')} placeholder="high_priority" /></FormField>
          <FormField label="Minimum score" hint="Leave empty if open-ended." error={rangeForm.formState.errors.min_score?.message}><NumberField {...rangeForm.register('min_score')} min="0" max="1" step="0.01" /></FormField>
          <FormField label="Maximum score" hint="Leave empty if open-ended." error={rangeForm.formState.errors.max_score?.message}><NumberField {...rangeForm.register('max_score')} min="0" max="1" step="0.01" /></FormField>
          <FormField label="Sort order" error={rangeForm.formState.errors.sort_order?.message}><NumberField {...rangeForm.register('sort_order')} min="1" step="1" /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteState.item)} title={`Delete ${deleteState.type || 'item'}`} description={`Delete ${deleteState.type === 'policy' ? deleteState.item?.categoryRef?.name || 'this policy' : deleteState.item?.label}?`} confirmLabel={((deleteState.type === 'policy' ? deletePolicyMutation.isPending : deleteRangeMutation.isPending) ? 'Deleting...' : 'Delete')} onClose={() => setDeleteState({ type: null, item: null })} onConfirm={handleDelete} />
    </div>
  )
}
