import { useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
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
  user_id: z.coerce.number().int().min(1, 'Silakan pilih akun pengguna.'),
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
  const createRoleValue = useWatch({ control: createForm.control, name: 'role' })
  const updateRoleValue = useWatch({ control: updateForm.control, name: 'role' })
  const userSearch = useUserSearch({ query: userSearchQuery, decisionModelId, enabled: createOpen })
  const userOptions = useMemo(
    () => (userSearch.data || []).map((user) => ({ value: String(user.id), label: `${user.name} (@${user.username})` })),
    [userSearch.data],
  )

  if (isLoading) return <LoadingState title="Memuat anggota" description="Menyiapkan daftar akses pengguna untuk model ini." />
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
      pushToast({ title: 'Anggota ditambahkan', description: 'Akses pengguna ke model ini berhasil diberikan.', tone: 'success' })
      closeCreateModal()
    } catch (submitError) {
      pushToast({ title: 'Gagal menambahkan anggota', description: submitError.message, tone: 'error' })
    }
  })

  const submitUpdate = updateForm.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ memberId: selectedMember.id, payload: values })
      pushToast({ title: 'Role diperbarui', description: 'Role anggota berhasil diperbarui.', tone: 'success' })
      setSelectedMember(null)
    } catch (submitError) {
      pushToast({ title: 'Gagal memperbarui role', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Anggota dihapus', description: 'Akses pengguna dari model ini berhasil dicabut.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Gagal menghapus anggota', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
        <PageHeader eyebrow="Anggota" title="Kelola anggota" actions={<Button type="button" onClick={() => setCreateOpen(true)}>Tambah anggota</Button>} />
      <SectionCard title="Anggota saat ini">
        <DataTable
          columns={[
            { key: 'user', header: 'Pengguna', render: (row) => row.user ? `${row.user.name} (@${row.user.username})` : row.user_id },
            { key: 'role', header: 'Role', render: (row) => <RoleBadge role={row.role} /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <ActionMenu
                  items={[
                     { label: 'Ubah role', onSelect: () => openUpdate(row) },
                     { label: 'Hapus anggota', tone: 'danger', onSelect: () => setDeleteTarget(row) },
                  ]}
                />
              ),
            },
          ]}
          rows={data}
        />
      </SectionCard>

      <Modal open={createOpen} title="Tambah anggota" onClose={closeCreateModal} footer={<><Button type="button" variant="ghost" onClick={closeCreateModal}>Batal</Button><Button type="submit" form="member-create-form" disabled={createForm.formState.isSubmitting || createMutation.isPending}>Tambah anggota</Button></>}>
        <form id="member-create-form" className="stack-md" onSubmit={submitCreate}>
          <FormField label="Akun pengguna" hint={selectedUserOption ? `Terpilih: ${selectedUserOption.label}` : 'Cari berdasarkan nama lengkap atau username, lalu pilih hasil di bawah.'} error={createForm.formState.errors.user_id?.message}>
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
                placeholder="Ketik nama atau username"
              />
              {userSearchQuery && !selectedUserOption ? (
                <div className="search-select-results">
                  {userSearch.isLoading ? (
                    <button type="button" className="search-select-option muted" disabled>
                      Mencari...
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
                      Pengguna tidak ditemukan
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </FormField>
          <FormField label="Role" error={createForm.formState.errors.role?.message}><DropdownSelect value={createRoleValue} options={ROLE_OPTIONS} onChange={(value) => createForm.setValue('role', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <Modal open={Boolean(selectedMember)} title={`Ubah role untuk ${selectedMember?.user?.name || 'anggota'}`} onClose={() => setSelectedMember(null)} footer={<><Button type="button" variant="ghost" onClick={() => setSelectedMember(null)}>Batal</Button><Button type="submit" form="member-update-form" disabled={updateForm.formState.isSubmitting || updateMutation.isPending}>Simpan role</Button></>}>
        <form id="member-update-form" className="stack-md" onSubmit={submitUpdate}>
          <FormField label="Role" error={updateForm.formState.errors.role?.message}><DropdownSelect value={updateRoleValue} options={ROLE_OPTIONS} onChange={(value) => updateForm.setValue('role', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus anggota" description={`Hapus ${deleteTarget?.user?.name || 'anggota ini'} dari model keputusan?`} confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus anggota'} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
