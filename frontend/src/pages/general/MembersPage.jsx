import { useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { FormField } from '../../components/form/FormField'
import { SelectField } from '../../components/form/SelectField'
import { TextField } from '../../components/form/TextField'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { RoleBadge } from '../../components/navigation/RoleBadge'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { ROLE_OPTIONS } from '../../constants/options'
import { useCreateMember, useDeleteMember, useMembers, useUpdateMember } from '../../features/members/useMembers'
import { useUserSearch } from '../../features/users/useUserSearch'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const createSchema = z.object({
  user_id: z.coerce.number().int().min(1, 'Please select a user account.'),
  role: z.enum(['owner', 'editor', 'viewer']),
})

const updateSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer']),
})

export function MembersPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [createOpen, setCreateOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedUserOption, setSelectedUserOption] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { data = [], isLoading, error, refetch } = useMembers(decisionModelId)
  const createMutation = useCreateMember(decisionModelId)
  const updateMutation = useUpdateMember(decisionModelId)
  const deleteMutation = useDeleteMember(decisionModelId)
  const createForm = useForm({ resolver: zodResolver(createSchema), defaultValues: { user_id: '', role: 'viewer' } })
  const updateForm = useForm({ resolver: zodResolver(updateSchema), defaultValues: { role: 'viewer' } })
  const userSearch = useUserSearch({ query: userSearchQuery, decisionModelId, enabled: createOpen })
  const userOptions = useMemo(
    () => (userSearch.data || []).map((user) => ({ value: String(user.id), label: `${user.name} (@${user.username})` })),
    [userSearch.data],
  )

  if (isLoading) return <LoadingState title="Loading members" description="Reading who can own, edit, or view this model." />
  if (error) return <ErrorState description={error.message} onAction={refetch} />

  const openUpdate = (member) => {
    setSelectedMember(member)
    updateForm.reset({ role: member.role })
  }

  const closeCreateModal = () => {
    setCreateOpen(false)
    setUserSearchQuery('')
    setSelectedUserOption(null)
    createForm.reset({ user_id: '', role: 'viewer' })
  }

  const submitCreate = createForm.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({ user_id: Number(values.user_id), role: values.role })
      pushToast({ title: 'Member added', description: 'User access has been granted to this model.', tone: 'success' })
      closeCreateModal()
    } catch (submitError) {
      pushToast({ title: 'Failed to add member', description: submitError.message, tone: 'error' })
    }
  })

  const submitUpdate = updateForm.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ memberId: selectedMember.id, payload: values })
      pushToast({ title: 'Role updated', description: 'Member role has been refreshed.', tone: 'success' })
      setSelectedMember(null)
    } catch (submitError) {
      pushToast({ title: 'Failed to update role', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Member removed', description: 'User access has been revoked from this model.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Failed to remove member', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Members" />
      <PageHeader eyebrow="Members" title="Keep access explicit and role changes easy to review." description="Search user accounts by name or username, then assign their role inside the decision model." actions={<Button type="button" onClick={() => setCreateOpen(true)}>Add member</Button>} />
      <SectionCard title="Current members" description="Owner, editor, and viewer badges make authorization visible before a change is made.">
        <DataTable
          columns={[
            { key: 'user', header: 'User', render: (row) => row.user ? `${row.user.name} (@${row.user.username})` : row.user_id },
            { key: 'role', header: 'Role', render: (row) => <RoleBadge role={row.role} /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <ActionMenu
                  items={[
                    { label: 'Change role', onSelect: () => openUpdate(row) },
                    { label: 'Remove member', tone: 'danger', onSelect: () => setDeleteTarget(row) },
                  ]}
                />
              ),
            },
          ]}
          rows={data}
        />
      </SectionCard>

      <Modal open={createOpen} title="Add member" onClose={closeCreateModal} footer={<><Button type="button" variant="ghost" onClick={closeCreateModal}>Cancel</Button><Button type="submit" form="member-create-form" disabled={createForm.formState.isSubmitting || createMutation.isPending}>Add member</Button></>}>
        <form id="member-create-form" className="stack-md" onSubmit={submitCreate}>
          <FormField label="User account" hint={selectedUserOption ? `Selected: ${selectedUserOption.label}` : 'Search by full name or username, then pick one result below.'} error={createForm.formState.errors.user_id?.message}>
            <input type="hidden" {...createForm.register('user_id')} />
            <div className="search-select">
              <TextField
                value={userSearchQuery}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setUserSearchQuery(nextValue)
                  setSelectedUserOption(null)
                  createForm.setValue('user_id', '')
                }}
                placeholder="Type a name or username"
              />
              {userSearchQuery && !selectedUserOption ? (
                <div className="search-select-results">
                  {userSearch.isLoading ? (
                    <button type="button" className="search-select-option muted" disabled>
                      Searching...
                    </button>
                  ) : userOptions.length ? (
                    userOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`search-select-option ${selectedUserOption?.value === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedUserOption(option)
                          setUserSearchQuery(option.label)
                          createForm.setValue('user_id', option.value, { shouldValidate: true })
                        }}
                      >
                        {option.label}
                      </button>
                    ))
                  ) : (
                    <button type="button" className="search-select-option muted" disabled>
                      No users found
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </FormField>
          <FormField label="Role" error={createForm.formState.errors.role?.message}><SelectField options={ROLE_OPTIONS} {...createForm.register('role')} /></FormField>
        </form>
      </Modal>

      <Modal open={Boolean(selectedMember)} title={`Change role for ${selectedMember?.user?.name || 'member'}`} onClose={() => setSelectedMember(null)} footer={<><Button type="button" variant="ghost" onClick={() => setSelectedMember(null)}>Cancel</Button><Button type="submit" form="member-update-form" disabled={updateForm.formState.isSubmitting || updateMutation.isPending}>Save role</Button></>}>
        <form id="member-update-form" className="stack-md" onSubmit={submitUpdate}>
          <FormField label="Role" error={updateForm.formState.errors.role?.message}><SelectField options={ROLE_OPTIONS} {...updateForm.register('role')} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Remove member" description={`Remove ${deleteTarget?.user?.name || 'this member'} from the decision model?`} confirmLabel={deleteMutation.isPending ? 'Removing...' : 'Remove member'} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
