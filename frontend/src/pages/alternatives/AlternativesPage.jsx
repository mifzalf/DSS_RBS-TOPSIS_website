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
  name: z.string().min(1, 'Nama wajib diisi.').max(150, 'Maksimal 150 karakter.'),
  description: z.string().max(5000, 'Maksimal 5000 karakter.').optional().or(z.literal('')),
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

  if (isLoading) return <LoadingState title="Memuat alternatif" description="Menyiapkan daftar rumah tangga atau kandidat yang dinilai." />
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
        pushToast({ title: 'Alternatif diperbarui', description: 'Detail alternatif berhasil diperbarui.', tone: 'success' })
      } else {
        await createMutation.mutateAsync(payload)
        pushToast({ title: 'Alternatif ditambahkan', description: 'Alternatif baru berhasil ditambahkan ke model.', tone: 'success' })
      }
      setOpen(false)
    } catch (submitError) {
      pushToast({ title: 'Permintaan alternatif gagal', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      pushToast({ title: 'Alternatif dihapus', description: 'Alternatif berhasil dihapus.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Gagal menghapus alternatif', description: deleteError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Alternatif" title="Kelola data alternatif" actions={<Button type="button" onClick={openCreate}>Tambah alternatif</Button>} />
      <SectionCard title="Daftar alternatif">
        <DataTable
          columns={[
            { key: 'name', header: 'Alternatif' },
            { key: 'description', header: 'Deskripsi', render: (row) => truncateText(row.description, 100) },
            { key: 'created_at', header: 'Dibuat' },
            { key: 'actions', header: '', align: 'right', render: (row) => <ActionMenu items={[{ label: 'Ubah', onSelect: () => openEdit(row) }, { label: 'Hapus', tone: 'danger', onSelect: () => setDeleteTarget(row) }]} /> },
          ]}
          rows={data}
        />
      </SectionCard>

      <Modal open={open} title={selectedAlternative ? 'Ubah alternatif' : 'Tambah alternatif'} onClose={() => setOpen(false)} footer={<><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" form="alternative-form" disabled={form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending}>Simpan</Button></>}>
        <form id="alternative-form" className="stack-md" onSubmit={onSubmit}>
          <FormField label="Nama" error={form.formState.errors.name?.message}><TextField {...form.register('name')} placeholder="Rumah Tangga A" /></FormField>
          <FormField label="Deskripsi" error={form.formState.errors.description?.message}><textarea className="input textarea" rows="4" {...form.register('description')} placeholder="Jelaskan alternatif atau rumah tangga ini." /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus alternatif" description={`Hapus ${deleteTarget?.name || 'alternatif ini'}?`} confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus'} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
