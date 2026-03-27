import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useFeedback } from '../../app/providers/useFeedback'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
import { RoleBadge } from '../../components/navigation/RoleBadge'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { useCreateDecisionModel, useDeleteDecisionModel, useDecisionModels, useUpdateDecisionModel } from '../../features/decision-model/useDecisionModels'
import { decisionModelSchema } from '../../features/decision-model/decisionModel.schema'
import { formatDate, truncateText } from '../../utils/format'
import { useState } from 'react'

export function DecisionModelListPage() {
  const [open, setOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { pushToast } = useFeedback()
  const { data = [], isLoading, error, refetch } = useDecisionModels()
  const createMutation = useCreateDecisionModel()
  const updateMutation = useUpdateDecisionModel()
  const deleteMutation = useDeleteDecisionModel()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(decisionModelSchema),
    defaultValues: { name: '', descriptions: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (selectedModel) {
        await updateMutation.mutateAsync({ id: selectedModel.id, payload: values })
        pushToast({ title: 'Decision model updated', description: 'The workspace details have been refreshed.', tone: 'success' })
      } else {
        await createMutation.mutateAsync(values)
        pushToast({ title: 'Decision model created', description: 'The workflow panel can now guide criteria, alternatives, and evaluations.', tone: 'success' })
      }
      reset()
      setSelectedModel(null)
      setOpen(false)
    } catch (submitError) {
      pushToast({ title: selectedModel ? 'Failed to update model' : 'Failed to create model', description: submitError.message, tone: 'error' })
    }
  })

  const openCreateModal = () => {
    setSelectedModel(null)
    reset({ name: '', descriptions: '' })
    setOpen(true)
  }

  const openEditModal = (model) => {
    setSelectedModel(model)
    setValue('name', model.name || '')
    setValue('descriptions', model.descriptions || '')
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Decision model deleted', description: 'The selected workspace has been removed.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Failed to delete model', description: deleteError.message, tone: 'error' })
    }
  }

  if (isLoading) {
    return <LoadingState title="Loading decision models" description="Preparing your model catalog and memberships." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  const ownerCount = data.filter((item) => item.role === 'owner').length
  const latestModel = data[0]

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Decision Models"
        title="Manage models as structured workspaces, not scattered CRUD pages."
        description="Every model becomes the anchor for members, criteria, alternatives, evaluations, rules, and final results."
        actions={
          <Button type="button" onClick={openCreateModal}>
            Create model
          </Button>
        }
      />

      <section className="stats-grid decision-model-stats-grid">
        <StatCard label="Total models" value={data.length} hint="Decision workspaces available in your account." />
        <StatCard label="Owner access" value={ownerCount} hint="Models where you control member and workflow management." />
        <StatCard label="Latest created" value={latestModel ? formatDate(latestModel.created_at) : '-'} hint="Most recent workspace entry." />
      </section>

      <SectionCard title="Model catalog" description="Role badge stays visible so ownership and permissions are easy to scan.">
        {data.length ? (
          <div className="decision-model-grid">
            {data.map((model) => (
              <article key={model.id} className="decision-model-card">
                <div className="decision-model-card-header">
                  <div className="stack-sm decision-model-card-copy">
                    <RoleBadge role={model.role} />
                    <h3>
                      <Link to={`/decision-models/${model.id}`}>{model.name}</Link>
                    </h3>
                    <p>{truncateText(model.descriptions, 140)}</p>
                  </div>
                  <ActionMenu
                    items={[
                      { label: 'Edit', onSelect: () => openEditModal(model) },
                      { label: 'Delete', tone: 'danger', onSelect: () => setDeleteTarget(model) },
                    ]}
                  />
                </div>

                <div className="decision-model-card-meta">
                  <div>
                    <span>Created</span>
                    <strong>{formatDate(model.created_at)}</strong>
                  </div>
                  <div>
                    <span>Updated</span>
                    <strong>{formatDate(model.updated_at || model.created_at)}</strong>
                  </div>
                </div>

                <div className="decision-model-card-actions">
                  <Link className="button button-secondary" to={`/decision-models/${model.id}`}>
                    Open workspace
                  </Link>
                  <Link className="button button-ghost" to={`/decision-models/${model.id}/recommendation`}>
                    Recommendation
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No model available" description="Start by creating one model so the app can unlock the staged DSS workflow." actionLabel="Create model" onAction={openCreateModal} />
        )}
      </SectionCard>

      <Modal
        open={open}
        title={selectedModel ? 'Edit decision model' : 'Create decision model'}
        onClose={() => {
          setOpen(false)
          setSelectedModel(null)
        }}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => {
              setOpen(false)
              setSelectedModel(null)
            }}>
              Cancel
            </Button>
            <Button type="submit" form="decision-model-form" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {selectedModel ? 'Save changes' : 'Save model'}
            </Button>
          </>
        }
      >
        <form id="decision-model-form" className="stack-md" onSubmit={onSubmit}>
          <FormField label="Model name" error={errors.name?.message}>
            <TextField placeholder="Scholarship selection 2026" {...register('name')} />
          </FormField>
          <FormField label="Description" hint="Optional context for the evaluation objective." error={errors.descriptions?.message}>
            <textarea className="input textarea" rows="4" placeholder="Explain what decision this model will support." {...register('descriptions')} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete decision model"
        description={`Delete ${deleteTarget?.name || 'this decision model'}? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete model'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
