import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/useAuth'
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
import { Drawer } from '../../components/ui/Drawer'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { WORKFLOW_STEPS } from '../../constants/workflow'
import { useCreateDecisionModel, useDeleteDecisionModel, useDecisionModels, useUpdateDecisionModel } from '../../features/decision-model/useDecisionModels'
import { decisionModelSchema } from '../../features/decision-model/decisionModel.schema'
import { formatDate, truncateText } from '../../utils/format'

export function DecisionModelListPage() {
  const [open, setOpen] = useState(false)
  const [journeyOpen, setJourneyOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { user, logout } = useAuth()
  const { pushToast } = useFeedback()
  const { data = [], isLoading, error, refetch } = useDecisionModels()
  const createMutation = useCreateDecisionModel()
  const updateMutation = useUpdateDecisionModel()
  const deleteMutation = useDeleteDecisionModel()
  const readyModelCount = useMemo(
    () =>
      data.filter((item) => {
        const summary = item.summary || item.progress || item.readiness || null

        if (!summary) {
          return false
        }

        return Boolean(
          summary.has_categories &&
            summary.has_criteria &&
            summary.has_balanced_weights &&
            summary.has_alternatives &&
            summary.has_rules &&
            summary.has_grade_policies,
        )
      }).length,
    [data],
  )
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
        pushToast({ title: 'Model keputusan diperbarui', description: 'Detail workspace berhasil diperbarui.', tone: 'success' })
      } else {
        await createMutation.mutateAsync(values)
        pushToast({ title: 'Model keputusan dibuat', description: 'Workspace baru siap digunakan untuk proses DSS.', tone: 'success' })
      }
      reset()
      setSelectedModel(null)
      setOpen(false)
    } catch (submitError) {
      pushToast({ title: selectedModel ? 'Gagal memperbarui model' : 'Gagal membuat model', description: submitError.message, tone: 'error' })
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
      pushToast({ title: 'Model keputusan dihapus', description: 'Workspace yang dipilih berhasil dihapus.', tone: 'success' })
      setDeleteTarget(null)
    } catch (deleteError) {
      pushToast({ title: 'Gagal menghapus model', description: deleteError.message, tone: 'error' })
    }
  }

  if (isLoading) {
    return <LoadingState title="Memuat model keputusan" description="Menyiapkan katalog model dan keanggotaan Anda." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  return (
    <div className="page-stack">
      <header className="topbar surface-panel root-topbar">
        <div className="topbar-main">
          <div className="topbar-context">
            <div className="topbar-heading">
              <strong className="topbar-title">Model keputusan</strong>
              <p>Pilih workspace program atau buat yang baru untuk memulai proses DSS.</p>
            </div>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="user-chip">
            <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            <div className="user-chip-copy">
              <strong>{user?.name || 'Pengguna'}</strong>
              <small>@{user?.username || 'session'}</small>
            </div>
          </div>
          <Button type="button" variant="ghost" className="topbar-logout-button" onClick={logout}>
            Keluar
          </Button>
        </div>
      </header>

      <PageHeader
        eyebrow="Model Keputusan"
        title="Kelola model keputusan"
        actions={
          <Button type="button" onClick={openCreateModal}>
            Tambah model
          </Button>
        }
      />

      <section className="stats-grid decision-model-stats-grid">
        <StatCard label="Total model" value={data.length} hint="Jumlah workspace keputusan pada akun Anda." />
        <StatCard label="Model siap digunakan" value={readyModelCount || '-'} hint={readyModelCount ? 'Program dengan konfigurasi inti DSS yang sudah lengkap.' : 'Menunggu ringkasan kesiapan dari backend.'} />
        <button type="button" className="stat-card stat-card-journey" onClick={() => setJourneyOpen(true)}>
          <span className="stat-card-label">Alur yang disarankan</span>
          <strong className="stat-card-value">Lihat tahapan</strong>
          <span className="stat-card-hint">Buka urutan kerja yang disarankan untuk menyusun program baru.</span>
        </button>
      </section>

      <SectionCard title="Daftar model">
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
                       { label: 'Ubah', onSelect: () => openEditModal(model) },
                       { label: 'Hapus', tone: 'danger', onSelect: () => setDeleteTarget(model) },
                    ]}
                  />
                </div>

                <div className="decision-model-card-meta">
                  <div>
                    <span>Dibuat</span>
                    <strong>{formatDate(model.created_at)}</strong>
                  </div>
                  <div>
                    <span>Diperbarui</span>
                    <strong>{formatDate(model.updated_at || model.created_at)}</strong>
                  </div>
                </div>

                <div className="decision-model-card-actions">
                  <Link className="button button-secondary" to={`/decision-models/${model.id}`}>
                    Workshop
                  </Link>
                  <Link className="button button-ghost" to={`/decision-models/${model.id}/recommendation`}>
                    Rekomendasi
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada model" description="Buat satu model terlebih dahulu agar alur DSS dapat digunakan." actionLabel="Tambah model" onAction={openCreateModal} />
        )}
      </SectionCard>

      <Modal
        open={open}
        title={selectedModel ? 'Ubah model keputusan' : 'Tambah model keputusan'}
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
              Batal
            </Button>
            <Button type="submit" form="decision-model-form" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {selectedModel ? 'Simpan perubahan' : 'Simpan model'}
            </Button>
          </>
        }
      >
        <form id="decision-model-form" className="stack-md" onSubmit={onSubmit}>
          <FormField label="Nama model" error={errors.name?.message}>
            <TextField placeholder="Seleksi beasiswa 2026" {...register('name')} />
          </FormField>
          <FormField label="Deskripsi" hint="Opsional" error={errors.descriptions?.message}>
            <textarea className="input textarea" rows="4" placeholder="Jelaskan keputusan yang didukung model ini." {...register('descriptions')} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus model keputusan"
        description={`Hapus ${deleteTarget?.name || 'model keputusan ini'}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus model'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Drawer open={journeyOpen} title="Alur yang disarankan" onClose={() => setJourneyOpen(false)}>
        <div className="workflow-list">
          {WORKFLOW_STEPS.map((step, index) => (
            <article key={step.key} className="workflow-item">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Drawer>
    </div>
  )
}
