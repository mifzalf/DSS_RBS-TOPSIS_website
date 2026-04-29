import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useFeedback } from '../../app/providers/useFeedback'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAssistanceCategories, useCreateAssistanceCategory, useDeleteAssistanceCategory, useUpdateAssistanceCategory } from '../../features/assistance-categories/useAssistanceCategories'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

const schema = z.object({
  code: z.string().min(1, 'Kode wajib diisi.').max(50, 'Maksimal 50 karakter.'),
  name: z.string().min(1, 'Nama wajib diisi.').max(100, 'Maksimal 100 karakter.'),
  description: z.string().max(5000, 'Maksimal 5000 karakter.').optional().or(z.literal('')),
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
  const categoryTypeValue = useWatch({ control: form.control, name: 'is_ranked' })
  const categoryStatusValue = useWatch({ control: form.control, name: 'status_active' })

  if (isLoading) return <LoadingState title="Memuat kategori" description="Menyiapkan kategori master untuk rule, grade, dan rekomendasi." />
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
        pushToast({ title: 'Kategori diperbarui', description: 'Pengaturan kategori berhasil diperbarui.', tone: 'success' })
      } else {
        await createMutation.mutateAsync(payload)
        pushToast({ title: 'Kategori dibuat', description: 'Kategori master baru siap digunakan untuk rule dan kebijakan grade.', tone: 'success' })
      }
      setModalState({ open: false, category: null })
    } catch (submitError) {
      pushToast({ title: 'Permintaan kategori gagal', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Kategori dihapus', description: 'Kategori master berhasil dihapus.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Gagal menghapus kategori', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Kategori" title="Kelola kategori" actions={<Button type="button" onClick={openCreate}>Tambah kategori</Button>} />
      <SectionCard title="Daftar kategori">
        {data.length ? (
          <DataTable
            columns={[
              { key: 'code', header: 'Kode' },
              { key: 'name', header: 'Nama' },
              { key: 'description', header: 'Deskripsi' },
              { key: 'is_ranked', header: 'Tipe', render: (row) => <Badge tone={row.is_ranked ? 'success' : 'warning'}>{row.is_ranked ? 'diperingkat' : 'ditolak'}</Badge> },
              { key: 'status_active', header: 'Status', render: (row) => <Badge tone={row.status_active ? 'success' : 'neutral'}>{row.status_active ? 'aktif' : 'nonaktif'}</Badge> },
              { key: 'actions', header: '', align: 'right', render: (row) => <ActionMenu items={[{ label: 'Ubah', onSelect: () => openEdit(row) }, { label: 'Hapus', tone: 'danger', onSelect: () => setDeleteTarget(row) }]} /> },
            ]}
            rows={data}
          />
        ) : (
          <EmptyState title="Belum ada kategori" description="Tambahkan minimal satu kategori sebelum membuat rule atau kebijakan grade." actionLabel="Tambah kategori" onAction={openCreate} />
        )}
      </SectionCard>

      <Modal open={modalState.open} title={modalState.category ? 'Ubah kategori' : 'Tambah kategori'} onClose={() => setModalState({ open: false, category: null })} footer={<><Button type="button" variant="ghost" onClick={() => setModalState({ open: false, category: null })}>Batal</Button><Button type="submit" form="assistance-category-form" disabled={form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending}>Simpan kategori</Button></>}>
        <form id="assistance-category-form" className="stack-md" onSubmit={submitForm}>
          <FormField label="Kode" error={form.formState.errors.code?.message}><TextField {...form.register('code')} placeholder="pkh" /></FormField>
          <FormField label="Nama" error={form.formState.errors.name?.message}><TextField {...form.register('name')} placeholder="PKH" /></FormField>
          <FormField label="Deskripsi" error={form.formState.errors.description?.message}><textarea className="input textarea" rows="4" {...form.register('description')} placeholder="Program Keluarga Harapan" /></FormField>
          <FormField label="Tipe kategori" error={form.formState.errors.is_ranked?.message}><DropdownSelect value={categoryTypeValue} options={[{ value: 'true', label: 'Kategori diperingkat' }, { value: 'false', label: 'Kategori ditolak' }]} onChange={(value) => form.setValue('is_ranked', value, { shouldValidate: true })} /></FormField>
          <FormField label="Status" error={form.formState.errors.status_active?.message}><DropdownSelect value={categoryStatusValue} options={[{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }]} onChange={(value) => form.setValue('status_active', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus kategori" description={`Hapus ${deleteTarget?.name || 'kategori ini'}?`} confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus'} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
