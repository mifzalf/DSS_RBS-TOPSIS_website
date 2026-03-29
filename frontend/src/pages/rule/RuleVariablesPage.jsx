import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useFeedback } from '../../app/providers/useFeedback'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { FormField } from '../../components/form/FormField'
import { SelectField } from '../../components/form/SelectField'
import { TextField } from '../../components/form/TextField'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { RULE_VARIABLE_TYPE_OPTIONS } from '../../constants/routes'
import { useCreateRuleVariable, useDeleteRuleVariable, useRuleVariables, useUpdateRuleVariable } from '../../features/rule-variable/useRuleVariables'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const schema = z.object({
  code: z.string().min(1, 'Code is required.').max(30, 'Maximum 30 characters.'),
  name: z.string().min(1, 'Name is required.').max(150, 'Maximum 150 characters.'),
  value_type: z.enum(['boolean', 'number', 'string']),
  description: z.string().max(5000, 'Maximum 5000 characters.').optional().or(z.literal('')),
  status_active: z.enum(['true', 'false']),
})

export function RuleVariablesPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [open, setOpen] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { data = [], isLoading, error, refetch } = useRuleVariables(decisionModelId)
  const createMutation = useCreateRuleVariable(decisionModelId)
  const updateMutation = useUpdateRuleVariable(decisionModelId)
  const deleteMutation = useDeleteRuleVariable(decisionModelId)
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', value_type: 'boolean', description: '', status_active: 'true' },
  })

  if (isLoading) {
    return <LoadingState title="Loading rule variables" description="Preparing typed RBS fact definitions for this decision model." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  const openCreate = () => {
    setSelectedVariable(null)
    reset({ code: '', name: '', value_type: 'boolean', description: '', status_active: 'true' })
    setOpen(true)
  }

  const openEdit = (item) => {
    setSelectedVariable(item)
    setValue('code', item.code)
    setValue('name', item.name)
    setValue('value_type', item.value_type)
    setValue('description', item.description || '')
    setValue('status_active', String(Boolean(item.status_active)))
    setOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      decision_model_id: Number(decisionModelId),
      status_active: values.status_active === 'true',
    }

    try {
      if (selectedVariable) {
        await updateMutation.mutateAsync({ id: selectedVariable.id, payload })
        pushToast({ title: 'Rule variable updated', description: 'Typed fact definition has been refreshed.', tone: 'success' })
      } else {
        await createMutation.mutateAsync(payload)
        pushToast({ title: 'Rule variable created', description: 'New typed fact can now be used in rule conditions.', tone: 'success' })
      }
      setOpen(false)
      setSelectedVariable(null)
    } catch (submitError) {
      pushToast({ title: 'Rule variable request failed', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Rule variable deleted', description: 'Typed fact definition has been removed.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Failed to delete rule variable', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Rule Variables" />
      <PageHeader
        eyebrow="Rule Variables"
        title="Define reusable RBS facts before writing conditions or filling evaluations."
        description="Variables formalize boolean, number, and string facts so rule conditions no longer depend on freeform field names."
        actions={<Button type="button" onClick={openCreate}>Add variable</Button>}
      />
      <SectionCard title="Variable catalog" description="Each variable can be reused across multiple rules and alternative-level rule evaluations.">
        {data.length ? (
          <DataTable
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'value_type', header: 'Type' },
              { key: 'status_active', header: 'Active', render: (row) => (row.status_active ? 'Yes' : 'No') },
              { key: 'description', header: 'Description' },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (row) => (
                  <ActionMenu
                    items={[
                      { label: 'Edit', onSelect: () => openEdit(row) },
                      { label: 'Delete', tone: 'danger', onSelect: () => setDeleteTarget(row) },
                    ]}
                  />
                ),
              },
            ]}
            rows={data}
          />
        ) : (
          <EmptyState title="No rule variables yet" description="Create typed variables so rules and RBS evaluations can reference formal facts." actionLabel="Add variable" onAction={openCreate} />
        )}
      </SectionCard>

      <Modal
        open={open}
        title={selectedVariable ? 'Edit rule variable' : 'Create rule variable'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="rule-variable-form" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>Save</Button>
          </>
        }
      >
        <form id="rule-variable-form" className="stack-md" onSubmit={onSubmit}>
          <FormField label="Code" error={errors.code?.message}><TextField {...register('code')} placeholder="V1" /></FormField>
          <FormField label="Name" error={errors.name?.message}><TextField {...register('name')} placeholder="Has pregnant mother" /></FormField>
          <FormField label="Value type" error={errors.value_type?.message}><SelectField options={RULE_VARIABLE_TYPE_OPTIONS} {...register('value_type')} /></FormField>
          <FormField label="Description" error={errors.description?.message}><textarea className="input textarea" rows="4" {...register('description')} placeholder="Explain the fact represented by this variable." /></FormField>
          <FormField label="Status" error={errors.status_active?.message}><SelectField options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} {...register('status_active')} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete rule variable" description={`Delete ${deleteTarget?.name || 'this variable'}?`} confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
