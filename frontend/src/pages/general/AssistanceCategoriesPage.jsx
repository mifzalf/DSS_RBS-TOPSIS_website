import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAssistanceCategories, useCreateAssistanceCategory, useDeleteAssistanceCategory, useUpdateAssistanceCategory } from '../../features/assistance-category/useAssistanceCategories'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const schema = z.object({
  code: z.string().min(1, 'Code is required.').max(50, 'Maximum 50 characters.'),
  name: z.string().min(1, 'Name is required.').max(100, 'Maximum 100 characters.'),
  description: z.string().max(5000, 'Maximum 5000 characters.').optional().or(z.literal('')),
  is_ranked: z.enum(['true', 'false']),
  status_active: z.enum(['true', 'false']),
})

export function AssistanceCategoriesPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [modalState, setModalState] = useState({ open: false, category: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { data = [], isLoading, error, refetch } = useAssistanceCategories(decisionModelId)
  const createMutation = useCreateAssistanceCategory(decisionModelId)
  const updateMutation = useUpdateAssistanceCategory(decisionModelId)
  const deleteMutation = useDeleteAssistanceCategory(decisionModelId)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', description: '', is_ranked: 'true', status_active: 'true' },
  })

  if (isLoading) return <LoadingState title="Loading assistance categories" description="Preparing master benefit categories for rules, grades, and grouped recommendations." />
  if (error) return <ErrorState description={error.message} onAction={refetch} />

  const openCreate = () => {
    form.reset({ code: '', name: '', description: '', is_ranked: 'true', status_active: 'true' })
    setModalState({ open: true, category: null })
  }

  const openEdit = (category) => {
    form.reset({ code: category.code, name: category.name, description: category.description || '', is_ranked: String(Boolean(category.is_ranked)), status_active: String(Boolean(category.status_active)) })
    setModalState({ open: true, category })
  }

  const submitForm = form.handleSubmit(async (values) => {
    const payload = {
      decision_model_id: Number(decisionModelId),
      code: values.code,
      name: values.name,
      description: values.description,
      is_ranked: values.is_ranked === 'true',
      status_active: values.status_active === 'true',
    }
    try {
      if (modalState.category) {
        await updateMutation.mutateAsync({ id: modalState.category.id, payload })
        pushToast({ title: 'Category updated', description: 'Assistance category settings have been refreshed.', tone: 'success' })
      } else {
        await createMutation.mutateAsync(payload)
        pushToast({ title: 'Category created', description: 'New master category is ready for rules and grade policies.', tone: 'success' })
      }
      setModalState({ open: false, category: null })
    } catch (submitError) {
      pushToast({ title: 'Category request failed', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Category deleted', description: 'Master category has been removed.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Failed to delete category', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Assistance categories" />
      <PageHeader eyebrow="Assistance Categories" title="Manage the master categories used by rules, grades, and recommendation groups." description="Categories are now the source of truth for category assignment, ranking behavior, and grade policy targeting." actions={<Button type="button" onClick={openCreate}>Add category</Button>} />
      <SectionCard title="Category catalog" description="Use ranked categories for benefit assignment and rejected categories for not-eligible outcomes.">
        {data.length ? (
          <DataTable
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'description', header: 'Description' },
              { key: 'is_ranked', header: 'Type', render: (row) => <Badge tone={row.is_ranked ? 'success' : 'warning'}>{row.is_ranked ? 'ranked' : 'rejected'}</Badge> },
              { key: 'status_active', header: 'Status', render: (row) => <Badge tone={row.status_active ? 'success' : 'neutral'}>{row.status_active ? 'active' : 'inactive'}</Badge> },
              { key: 'actions', header: '', align: 'right', render: (row) => <ActionMenu items={[{ label: 'Edit', onSelect: () => openEdit(row) }, { label: 'Delete', tone: 'danger', onSelect: () => setDeleteTarget(row) }]} /> },
            ]}
            rows={data}
          />
        ) : (
          <EmptyState title="No categories configured" description="Create at least one assistance category before writing rules or grade policies." actionLabel="Add category" onAction={openCreate} />
        )}
      </SectionCard>

      <Modal open={modalState.open} title={modalState.category ? 'Edit assistance category' : 'Create assistance category'} onClose={() => setModalState({ open: false, category: null })} footer={<><Button type="button" variant="ghost" onClick={() => setModalState({ open: false, category: null })}>Cancel</Button><Button type="submit" form="assistance-category-form" disabled={form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending}>Save category</Button></>}>
        <form id="assistance-category-form" className="stack-md" onSubmit={submitForm}>
          <FormField label="Code" error={form.formState.errors.code?.message}><TextField {...form.register('code')} placeholder="pkh" /></FormField>
          <FormField label="Name" error={form.formState.errors.name?.message}><TextField {...form.register('name')} placeholder="PKH" /></FormField>
          <FormField label="Description" error={form.formState.errors.description?.message}><textarea className="input textarea" rows="4" {...form.register('description')} placeholder="Program Keluarga Harapan" /></FormField>
          <FormField label="Category type" error={form.formState.errors.is_ranked?.message}><SelectField options={[{ value: 'true', label: 'Ranked category' }, { value: 'false', label: 'Rejected category' }]} {...form.register('is_ranked')} /></FormField>
          <FormField label="Status" error={form.formState.errors.status_active?.message}><SelectField options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} {...form.register('status_active')} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete assistance category" description={`Delete ${deleteTarget?.name || 'this category'}?`} confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
