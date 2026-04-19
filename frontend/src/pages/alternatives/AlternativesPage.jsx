import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAlternatives, useCreateAlternative, useDeleteAlternative, useUpdateAlternative } from '../../features/alternatives/useAlternatives'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { truncateText } from '../../utils/format'

const schema = z.object({
  name: z.string().min(1, 'Name is required.').max(150, 'Maximum 150 characters.'),
  description: z.string().max(5000, 'Maximum 5000 characters.').optional().or(z.literal('')),
})

export function AlternativesPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [open, setOpen] = useState(false)
  const [selectedAlternative, setSelectedAlternative] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { data = [], isLoading, error, refetch } = useAlternatives(decisionModelId)
  const createMutation = useCreateAlternative(decisionModelId)
  const updateMutation = useUpdateAlternative(decisionModelId)
  const deleteMutation = useDeleteAlternative(decisionModelId)
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } })

  if (isLoading) return <LoadingState title="Loading alternatives" description="Preparing the list of candidates being evaluated." />
  if (error) return <ErrorState description={error.message} onAction={refetch} />

  const openCreate = () => {
    setSelectedAlternative(null)
    form.reset({ name: '', description: '' })
    setOpen(true)
  }

  const openEdit = (item) => {
    setSelectedAlternative(item)
    form.reset({ name: item.name, description: item.description || '' })
    setOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, decision_model_id: Number(decisionModelId) }
    try {
      if (selectedAlternative) {
        await updateMutation.mutateAsync({ id: selectedAlternative.id, payload })
        pushToast({ title: 'Alternative updated', description: 'Candidate details have been refreshed.', tone: 'success' })
      } else {
        await createMutation.mutateAsync(payload)
        pushToast({ title: 'Alternative created', description: 'Candidate option has been added to the model.', tone: 'success' })
      }
      setOpen(false)
    } catch (submitError) {
      pushToast({ title: 'Alternative request failed', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Alternative deleted', description: 'Candidate option has been removed.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Failed to delete alternative', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Alternatives" title="Keep candidate options clean, comparable, and easy to scan." description="Manage the candidate list that will later receive both TOPSIS and RBS inputs." actions={<Button type="button" onClick={openCreate}>Add alternative</Button>} />
      <SectionCard title="Alternative table" description="Create, update, and remove candidate options from one compact list.">
        <DataTable
          columns={[
            { key: 'name', header: 'Alternative' },
            { key: 'description', header: 'Description', render: (row) => truncateText(row.description, 100) },
            { key: 'created_at', header: 'Created' },
            { key: 'actions', header: '', align: 'right', render: (row) => <ActionMenu items={[{ label: 'Edit', onSelect: () => openEdit(row) }, { label: 'Delete', tone: 'danger', onSelect: () => setDeleteTarget(row) }]} /> },
          ]}
          rows={data}
        />
      </SectionCard>

      <Modal open={open} title={selectedAlternative ? 'Edit alternative' : 'Create alternative'} onClose={() => setOpen(false)} footer={<><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="alternative-form" disabled={form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending}>Save</Button></>}>
        <form id="alternative-form" className="stack-md" onSubmit={onSubmit}>
          <FormField label="Name" error={form.formState.errors.name?.message}><TextField {...form.register('name')} placeholder="Candidate A" /></FormField>
          <FormField label="Description" error={form.formState.errors.description?.message}><textarea className="input textarea" rows="4" {...form.register('description')} placeholder="Describe the candidate option." /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete alternative" description={`Delete ${deleteTarget?.name || 'this alternative'}?`} confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
