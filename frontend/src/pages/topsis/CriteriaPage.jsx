import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { FormField } from '../../components/form/FormField'
import { NumberField } from '../../components/form/NumberField'
import { TextField } from '../../components/form/TextField'
import { StatusBadge } from '../../components/navigation/StatusBadge'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressIndicator } from '../../components/ui/ProgressIndicator'
import { SectionCard } from '../../components/ui/SectionCard'
import { CRITERIA_TYPE_OPTIONS } from '../../constants/options'
import { useCreateCriteria, useCreateSubCriteria, useCriteriaWithSubCriteria, useDeleteCriteria, useDeleteSubCriteria, useUpdateCriteria, useUpdateSubCriteria } from '../../features/criteria/useCriteria'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { formatDecimal, formatPercent } from '../../utils/format'

function ExpandIcon({ expanded }) {
  return (
    <svg className={`criteria-toggle-icon${expanded ? ' expanded' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const criteriaSchema = z.object({
  code: z.string().max(30, 'Maksimal 30 karakter.').optional().or(z.literal('')),
  name: z.string().min(1, 'Nama wajib diisi.').max(150, 'Maksimal 150 karakter.'),
  type: z.enum(['benefit', 'cost']),
  weight: z.coerce.number().min(0, 'Nilai minimal 0.').max(1, 'Nilai maksimal 1.'),
  status_active: z.enum(['true', 'false']).optional(),
})

const subCriteriaSchema = z.object({
  label: z.string().min(1, 'Label wajib diisi.').max(150, 'Maksimal 150 karakter.'),
  value: z.coerce.number().int().min(0, 'Nilai minimal 0.'),
})

export function CriteriaPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [expandedCriteriaId, setExpandedCriteriaId] = useState(null)
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false)
  const [subCriteriaModalOpen, setSubCriteriaModalOpen] = useState(false)
  const [selectedCriteria, setSelectedCriteria] = useState(null)
  const [selectedSubCriteria, setSelectedSubCriteria] = useState(null)
  const [deleteState, setDeleteState] = useState({ type: null, item: null })
  const { data = [], isLoading, error, refetch } = useCriteriaWithSubCriteria(decisionModelId)
  const createCriteriaMutation = useCreateCriteria(decisionModelId)
  const updateCriteriaMutation = useUpdateCriteria(decisionModelId)
  const deleteCriteriaMutation = useDeleteCriteria(decisionModelId)
  const createSubCriteriaMutation = useCreateSubCriteria(decisionModelId)
  const updateSubCriteriaMutation = useUpdateSubCriteria(decisionModelId)
  const deleteSubCriteriaMutation = useDeleteSubCriteria(decisionModelId)
  const criteriaForm = useForm({
    resolver: zodResolver(criteriaSchema),
    defaultValues: { code: '', name: '', type: 'benefit', weight: 0, status_active: 'true' },
  })
  const subCriteriaForm = useForm({
    resolver: zodResolver(subCriteriaSchema),
    defaultValues: { label: '', value: 0 },
  })
  const criteriaTypeValue = useWatch({ control: criteriaForm.control, name: 'type' })
  const criteriaStatusValue = useWatch({ control: criteriaForm.control, name: 'status_active' })

  if (isLoading) {
    return <LoadingState title="Memuat kriteria" description="Memeriksa kriteria berbobot dan sub-kriteria pada model ini." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  const totalWeight = data.reduce((sum, item) => sum + Number(item.weight || 0), 0)

  const openCreateCriteria = () => {
    setSelectedCriteria(null)
    criteriaForm.reset({ code: '', name: '', type: 'benefit', weight: 0, status_active: 'true' })
    setCriteriaModalOpen(true)
  }

  const openEditCriteria = (criteria) => {
    setSelectedCriteria(criteria)
    criteriaForm.reset({ code: criteria.code || '', name: criteria.name, type: criteria.type, weight: criteria.weight, status_active: String(Boolean(criteria.status_active)) })
    setCriteriaModalOpen(true)
  }

  const openCreateSubCriteria = (criteria) => {
    setSelectedCriteria(criteria)
    setSelectedSubCriteria(null)
    subCriteriaForm.reset({ label: '', value: 0 })
    setSubCriteriaModalOpen(true)
  }

  const openEditSubCriteria = (criteria, subCriteria) => {
    setSelectedCriteria(criteria)
    setSelectedSubCriteria(subCriteria)
    subCriteriaForm.reset({ label: subCriteria.label, value: subCriteria.value })
    setSubCriteriaModalOpen(true)
  }

  const submitCriteria = criteriaForm.handleSubmit(async (values) => {
    const payload = {
      decision_model_id: Number(decisionModelId),
      code: values.code || undefined,
      name: values.name,
      type: values.type,
      weight: Number(values.weight),
      status_active: values.status_active === 'true',
    }

    try {
      if (selectedCriteria) {
        await updateCriteriaMutation.mutateAsync({ id: selectedCriteria.id, payload })
        pushToast({ title: 'Kriteria diperbarui', description: 'Pengaturan kriteria berhasil diperbarui.', tone: 'success' })
      } else {
        await createCriteriaMutation.mutateAsync(payload)
        pushToast({ title: 'Kriteria ditambahkan', description: 'Kriteria berbobot baru berhasil ditambahkan.', tone: 'success' })
      }
      setCriteriaModalOpen(false)
    } catch (submitError) {
      pushToast({ title: 'Permintaan kriteria gagal', description: submitError.message, tone: 'error' })
    }
  })

  const submitSubCriteria = subCriteriaForm.handleSubmit(async (values) => {
    try {
      if (selectedSubCriteria) {
        await updateSubCriteriaMutation.mutateAsync({ id: selectedSubCriteria.id, criteriaId: selectedCriteria?.id ?? selectedSubCriteria.criteria_id, payload: values })
        pushToast({ title: 'Sub-kriteria diperbarui', description: 'Opsi penilaian berhasil diperbarui.', tone: 'success' })
      } else {
        await createSubCriteriaMutation.mutateAsync({ criteriaId: selectedCriteria.id, payload: { criteria_id: selectedCriteria.id, ...values } })
        pushToast({ title: 'Sub-kriteria ditambahkan', description: 'Opsi penilaian baru berhasil ditambahkan.', tone: 'success' })
      }
      setSubCriteriaModalOpen(false)
    } catch (submitError) {
      pushToast({ title: 'Permintaan sub-kriteria gagal', description: submitError.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      if (deleteState.type === 'criteria') {
        await deleteCriteriaMutation.mutateAsync(deleteState.item.id)
        pushToast({ title: 'Kriteria dihapus', description: 'Kriteria beserta opsi turunannya berhasil dihapus.', tone: 'success' })
      }
      if (deleteState.type === 'subCriteria') {
        await deleteSubCriteriaMutation.mutateAsync({ id: deleteState.item.id, criteriaId: deleteState.item.criteria_id })
        pushToast({ title: 'Sub-kriteria dihapus', description: 'Opsi penilaian berhasil dihapus.', tone: 'success' })
      }
      setDeleteState({ type: null, item: null })
    } catch (deleteError) {
      pushToast({ title: 'Permintaan hapus gagal', description: deleteError.message, tone: 'error' })
    }
  }

  const toggleCriteriaExpansion = (criteriaId) => {
    setExpandedCriteriaId((currentId) => (currentId === criteriaId ? null : criteriaId))
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Kriteria"
        title="Kelola kriteria TOPSIS"
        actions={<Button type="button" onClick={openCreateCriteria}>Tambah kriteria</Button>}
      />
      <div className="content-grid two-column">
        <SectionCard title="Daftar kriteria">
          <DataTable
            columns={[
              { key: 'code', header: 'Kode' },
              { key: 'name', header: 'Nama' },
              { key: 'type', header: 'Tipe' },
              { key: 'weight', header: 'Bobot', render: (row) => formatDecimal(row.weight) },
              { key: 'status_active', header: 'Status', render: (row) => <StatusBadge status={row.status_active ? 'active' : 'inactive'} /> },
              { key: 'subCriteria', header: 'Sub-kriteria', render: (row) => row.subCriteria.length },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (row) => (
                  <ActionMenu
                    items={[
                       { label: 'Tambah sub-kriteria', onSelect: () => openCreateSubCriteria(row) },
                       { label: 'Ubah kriteria', onSelect: () => openEditCriteria(row) },
                       { label: 'Hapus kriteria', tone: 'danger', onSelect: () => setDeleteState({ type: 'criteria', item: row }) },
                    ]}
                  />
                ),
              },
            ]}
            rows={data}
          />
        </SectionCard>
        <SectionCard title="Monitor bobot">
          <div className="stack-lg">
            <ProgressIndicator value={Math.min(100, Math.round(totalWeight * 100))} label="Total bobot" hint={totalWeight === 1 ? 'Total bobot sudah ideal.' : `Total bobot saat ini ${formatPercent(totalWeight)} dan seharusnya mencapai 100%.`} tone={totalWeight === 1 ? 'success' : 'warning'} />
            <div className="stack-sm">
              {data.map((item) => (
                <article key={item.id} className="mini-card criteria-nested-card">
                  <div className="criteria-nested-head">
                    <div>
                      <strong>{item.name}</strong>
                        <p>{item.type} - {formatPercent(item.weight)}</p>
                    </div>
                    <div className="criteria-nested-actions">
                      <Button type="button" variant="ghost" onClick={() => openCreateSubCriteria(item)}>Tambah sub-kriteria</Button>
                      <button
                        type="button"
                        className="criteria-toggle-button"
                        onClick={() => toggleCriteriaExpansion(item.id)}
                        aria-label={expandedCriteriaId === item.id ? `Sembunyikan sub-kriteria untuk ${item.name}` : `Tampilkan sub-kriteria untuk ${item.name}`}
                        aria-expanded={expandedCriteriaId === item.id}
                      >
                        <ExpandIcon expanded={expandedCriteriaId === item.id} />
                      </button>
                    </div>
                  </div>
                  {expandedCriteriaId === item.id ? (
                    <div className="criteria-subcriteria-list">
                      {item.subCriteria.length ? item.subCriteria.map((subCriteria) => (
                        <div key={subCriteria.id} className="criteria-subcriteria-item">
                          <div>
                            <strong>{subCriteria.label}</strong>
                            <p>Nilai {subCriteria.value}</p>
                          </div>
                          <ActionMenu
                            items={[
                               { label: 'Ubah', onSelect: () => openEditSubCriteria(item, subCriteria) },
                               { label: 'Hapus', tone: 'danger', onSelect: () => setDeleteState({ type: 'subCriteria', item: { ...subCriteria, criteria_id: subCriteria.criteria_id ?? item.id } }) },
                            ]}
                          />
                        </div>
                      )) : <p className="subtle-text">Belum ada sub-kriteria.</p>}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <Modal
        open={criteriaModalOpen}
        title={selectedCriteria ? 'Ubah kriteria' : 'Tambah kriteria'}
        onClose={() => setCriteriaModalOpen(false)}
        footer={<><Button type="button" variant="ghost" onClick={() => setCriteriaModalOpen(false)}>Batal</Button><Button type="submit" form="criteria-form" disabled={criteriaForm.formState.isSubmitting || createCriteriaMutation.isPending || updateCriteriaMutation.isPending}>Simpan</Button></>}
      >
        <form id="criteria-form" className="stack-md" onSubmit={submitCriteria}>
          <FormField label="Kode" error={criteriaForm.formState.errors.code?.message}><TextField {...criteriaForm.register('code')} placeholder="C1" /></FormField>
          <FormField label="Nama" error={criteriaForm.formState.errors.name?.message}><TextField {...criteriaForm.register('name')} placeholder="Pendapatan rumah tangga" /></FormField>
          <FormField label="Tipe" error={criteriaForm.formState.errors.type?.message}><DropdownSelect value={criteriaTypeValue} options={CRITERIA_TYPE_OPTIONS} onChange={(value) => criteriaForm.setValue('type', value, { shouldValidate: true })} /></FormField>
          <FormField label="Bobot" hint="Rentang 0 sampai 1" error={criteriaForm.formState.errors.weight?.message}><NumberField {...criteriaForm.register('weight')} min="0" max="1" step="0.01" /></FormField>
          <FormField label="Status" error={criteriaForm.formState.errors.status_active?.message}><DropdownSelect value={criteriaStatusValue} options={[{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }]} onChange={(value) => criteriaForm.setValue('status_active', value, { shouldValidate: true })} /></FormField>
        </form>
      </Modal>

      <Modal
        open={subCriteriaModalOpen}
        title={selectedSubCriteria ? `Ubah sub-kriteria untuk ${selectedCriteria?.name}` : `Tambah sub-kriteria ke ${selectedCriteria?.name}`}
        onClose={() => setSubCriteriaModalOpen(false)}
        footer={<><Button type="button" variant="ghost" onClick={() => setSubCriteriaModalOpen(false)}>Batal</Button><Button type="submit" form="subcriteria-form" disabled={subCriteriaForm.formState.isSubmitting || createSubCriteriaMutation.isPending || updateSubCriteriaMutation.isPending}>Simpan</Button></>}
      >
        <form id="subcriteria-form" className="stack-md" onSubmit={submitSubCriteria}>
          <FormField label="Label" error={subCriteriaForm.formState.errors.label?.message}><TextField {...subCriteriaForm.register('label')} placeholder="Pendapatan di bawah ambang wilayah" /></FormField>
          <FormField label="Nilai" error={subCriteriaForm.formState.errors.value?.message}><NumberField {...subCriteriaForm.register('value')} min="0" step="1" /></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteState.item)} title={`Hapus ${deleteState.type === 'criteria' ? 'kriteria' : 'sub-kriteria'}`} description={`Hapus ${deleteState.item?.name || deleteState.item?.label || 'item ini'}?`} confirmLabel={(deleteState.type === 'criteria' ? deleteCriteriaMutation.isPending : deleteSubCriteriaMutation.isPending) ? 'Menghapus...' : 'Hapus'} onClose={() => setDeleteState({ type: null, item: null })} onConfirm={handleDelete} />
    </div>
  )
}
