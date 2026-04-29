import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusBadge } from '../../components/navigation/StatusBadge'
import { FormField } from '../../components/form/FormField'
import { TextField } from '../../components/form/TextField'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressIndicator } from '../../components/ui/ProgressIndicator'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { useAlternatives } from '../../features/alternatives/useAlternatives'
import { useAssistanceCategories } from '../../features/assistance-categories/useAssistanceCategories'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { decisionModelSchema } from '../../features/decision-model/decisionModel.schema'
import { useDeleteDecisionModel, useDecisionModel, useUpdateDecisionModel } from '../../features/decision-model/useDecisionModels'
import { useEvaluationOverview } from '../../features/evaluation/useEvaluationOverview'
import { useRuleVariables } from '../../features/rule-variable/useRuleVariables'
import { useRulesWithConditions } from '../../features/rule/useRules'
import { useResults } from '../../features/result/useResults'
import { useGradePolicies } from '../../features/grade-policies/useGradePolicies'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { ruleEvaluationApi } from '../../services/api/rule-evaluation.api'
import { formatPercent } from '../../utils/format'

const WEIGHT_TOLERANCE = 0.0001

function buildReadinessStatus(value, expected = 1) {
  if (value >= expected && expected > 0) return 'ready'
  if (value > 0) return 'warning'
  return 'pending'
}

function toProgress(checks) {
  const normalizedChecks = checks.filter((check) => check !== null)
  const total = normalizedChecks.length || 1
  const completed = normalizedChecks.filter(Boolean).length
  return Math.round((completed / total) * 100)
}

export function DecisionModelDetailPage() {
  const decisionModelId = useDecisionModelId()
  const navigate = useNavigate()
  const { pushToast } = useFeedback()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const modelQuery = useDecisionModel(decisionModelId)
  const updateMutation = useUpdateDecisionModel()
  const deleteMutation = useDeleteDecisionModel()
  const criteriaQuery = useCriteriaWithSubCriteria(decisionModelId)
  const categoriesQuery = useAssistanceCategories(decisionModelId)
  const alternativesQuery = useAlternatives(decisionModelId)
  const ruleVariablesQuery = useRuleVariables(decisionModelId)
  const gradePoliciesQuery = useGradePolicies(decisionModelId)
  const rulesQuery = useRulesWithConditions(decisionModelId)
  const resultsQuery = useResults(decisionModelId)
  const evaluationOverview = useEvaluationOverview(alternativesQuery.data || [], criteriaQuery.data || [])
  const alternatives = alternativesQuery.data || []
  const ruleEvaluationQueries = useQueries({
    queries: alternatives.map((alternative) => ({
      queryKey: ['rule-evaluations-overview', alternative.id],
      queryFn: () => ruleEvaluationApi.listByAlternative(alternative.id),
      enabled: Boolean(alternative.id),
    })),
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(decisionModelSchema),
    defaultValues: { name: '', descriptions: '' },
  })

  if (
    modelQuery.isLoading ||
    criteriaQuery.isLoading ||
    categoriesQuery.isLoading ||
    alternativesQuery.isLoading ||
    ruleVariablesQuery.isLoading ||
    gradePoliciesQuery.isLoading ||
    rulesQuery.isLoading ||
    resultsQuery.isLoading ||
    evaluationOverview.isLoading ||
    ruleEvaluationQueries.some((query) => query.isLoading)
  ) {
    return <LoadingState title="Memuat ringkasan model" description="Menyusun tingkat kesiapan workflow untuk model keputusan ini." />
  }

  if (modelQuery.error) {
    return <ErrorState description={modelQuery.error.message} onAction={modelQuery.refetch} />
  }

  const model = modelQuery.data
  const criteria = criteriaQuery.data || []
  const categories = categoriesQuery.data || []

  const ruleVariables = ruleVariablesQuery.data || []
  const gradePolicies = gradePoliciesQuery.data || []
  const rules = rulesQuery.data || []
  const results = resultsQuery.data || []
  const evaluations = evaluationOverview.data || []
  const completedEvaluationCells = evaluations.reduce((sum, row) => sum + row.completed, 0)
  const expectedEvaluationCells = evaluations.reduce((sum, row) => sum + row.expected, 0)
  const evaluationProgress = expectedEvaluationCells ? Math.round((completedEvaluationCells / expectedEvaluationCells) * 100) : 0
  const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  const isWeightBalanced = Math.abs(totalWeight - 1) <= WEIGHT_TOLERANCE
  const totalRuleEvaluations = ruleEvaluationQueries.reduce((sum, query) => sum + (query.data?.length || 0), 0)
  const expectedRuleEvaluations = alternatives.length * ruleVariables.length
  const rankedCategories = categories.filter((item) => item.is_ranked).length
  const rejectedCategories = categories.filter((item) => !item.is_ranked).length
  const gradeRangeCount = gradePolicies.reduce((sum, policy) => sum + (policy.ranges?.length || 0), 0)
  const hasCategories = categories.length > 0
  const hasGradePolicies = gradePolicies.length > 0
  const hasValidGradeRanges = gradePolicies.length > 0 && gradePolicies.every((policy) => (policy.ranges?.length || 0) > 0)
  const hasCriteria = criteria.length > 0
  const hasBalancedWeights = isWeightBalanced
  const hasRuleVariables = ruleVariables.length > 0
  const hasRules = rules.length > 0
  const hasAlternatives = alternatives.length > 0
  const hasCompleteTopsisEvaluations = alternatives.length > 0 && expectedEvaluationCells > 0 && evaluationProgress === 100
  const hasRuleEvaluations = alternatives.length > 0 && ruleVariables.length > 0 && totalRuleEvaluations >= expectedRuleEvaluations
  const hasRecommendations = results.length > 0

  const generalChecks = [hasCategories, hasGradePolicies, hasValidGradeRanges, hasRecommendations]
  const topsisChecks = [hasCriteria, hasBalancedWeights]
  const ruleBaseChecks = [hasRuleVariables, hasRules]
  const alternativesChecks = [
    hasAlternatives,
    alternatives.length > 0 ? hasCompleteTopsisEvaluations : null,
    alternatives.length > 0 && ruleVariables.length > 0 ? hasRuleEvaluations : null,
  ]
  const overallChecks = [...generalChecks, ...topsisChecks, ...ruleBaseChecks, ...alternativesChecks]

  const generalProgress = toProgress(generalChecks)
  const topsisProgress = toProgress(topsisChecks)
  const ruleBaseProgress = toProgress(ruleBaseChecks)
  const alternativesProgress = toProgress(alternativesChecks)
  const overallProgress = toProgress(overallChecks)
  const workspaceGroups = [
    {
      key: 'general',
      title: 'Ruang kerja umum',
      description: 'Konteks program, master tipe keputusan, pemeringkatan, dan keluaran DSS akhir.',
      items: [
        { label: 'Tipe keputusan', href: `/decision-models/${decisionModelId}/assistance-categories`, count: categories.length, status: buildReadinessStatus(categories.length) },
        { label: 'Kelola pemeringkatan', href: `/decision-models/${decisionModelId}/grade-policies`, count: `${gradePolicies.length} kebijakan / ${gradeRangeCount} rentang`, status: gradePolicies.length === 0 ? 'pending' : hasValidGradeRanges ? 'ready' : 'warning' },
        { label: 'Rekomendasi', href: `/decision-models/${decisionModelId}/recommendation`, count: results.length ? 'Tersedia' : 'Menunggu', status: hasRecommendations ? 'ready' : 'pending' },
      ],
    },
    {
      key: 'topsis',
      title: 'Penyusun TOPSIS',
      description: 'Susun bobot kriteria yang membentuk penilaian preferensi.',
      progress: topsisProgress,
      items: [
        { label: 'Kriteria', href: `/decision-models/${decisionModelId}/criteria`, count: criteria.length, status: buildReadinessStatus(criteria.length) },
        { label: 'Keseimbangan bobot', href: `/decision-models/${decisionModelId}/criteria`, count: formatPercent(totalWeight), status: isWeightBalanced ? 'ready' : totalWeight > 0 ? 'warning' : 'pending' },
      ],
    },
    {
      key: 'rule-base',
      title: 'Rule Base',
      description: 'Atur fakta bertipe dan rule bisnis untuk menentukan tipe keputusan sebelum pemeringkatan.',
      progress: ruleBaseProgress,
      items: [
        { label: 'Variabel rule', href: `/decision-models/${decisionModelId}/rules`, count: ruleVariables.length, status: buildReadinessStatus(ruleVariables.length) },
        { label: 'Rule', href: `/decision-models/${decisionModelId}/rules`, count: rules.length, status: buildReadinessStatus(rules.length) },
      ],
    },
    {
      key: 'alternatives',
      title: 'Ruang kerja alternatif',
      description: 'Kelola rumah tangga dan lengkapi jawaban TOPSIS maupun rule-based.',
      progress: alternativesProgress,
      items: [
        { label: 'Alternatif', href: `/decision-models/${decisionModelId}/alternatives`, count: alternatives.length, status: buildReadinessStatus(alternatives.length) },
        { label: 'Evaluasi TOPSIS', href: `/decision-models/${decisionModelId}/evaluations`, count: `${completedEvaluationCells}/${expectedEvaluationCells}`, status: hasCompleteTopsisEvaluations ? 'ready' : evaluationProgress > 0 ? 'warning' : 'pending' },
        { label: 'Evaluasi Rule', href: `/decision-models/${decisionModelId}/rule-evaluations`, count: `${totalRuleEvaluations}/${expectedRuleEvaluations || 0}`, status: hasRuleEvaluations ? 'ready' : totalRuleEvaluations > 0 ? 'warning' : 'pending' },
      ],
    },
  ]

  const openEditModal = () => {
    reset({ name: model.name || '', descriptions: model.descriptions || '' })
    setEditOpen(true)
  }

  const handleUpdate = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ id: decisionModelId, payload: values })
      pushToast({ title: 'Model keputusan diperbarui', description: 'Informasi ruang kerja berhasil diperbarui.', tone: 'success' })
      setEditOpen(false)
    } catch (error) {
      pushToast({ title: 'Gagal memperbarui model', description: error.message, tone: 'error' })
    }
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(decisionModelId)
      pushToast({ title: 'Model keputusan dihapus', description: 'Ruang kerja berhasil dihapus.', tone: 'success' })
      navigate('/decision-models')
    } catch (error) {
      pushToast({ title: 'Gagal menghapus model', description: error.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Model Keputusan"
        title={model.name}
        description={model.descriptions || undefined}
        actions={
          <div className="decision-model-page-actions">
            <ActionMenu
              items={[
                { label: 'Ubah', onSelect: openEditModal },
                { label: 'Hapus', tone: 'danger', onSelect: () => setDeleteOpen(true) },
              ]}
              align="left"
            />
            <Link className="button button-secondary" to={`/decision-models/${decisionModelId}/recommendation`}>
              Buka rekomendasi
            </Link>
          </div>
        }
      />

      <section className="decision-model-hero-grid">
        <SectionCard title="Pusat kendali workspace">
          <div className="decision-model-hero-stats">
            <StatCard label="Tipe keputusan" value={categories.length} hint={`${rankedCategories} diperingkat / ${rejectedCategories} ditolak`} />
            <StatCard label="Alternatif" value={alternatives.length} hint="Alternatif siap untuk penilaian dan jawaban rule." />
            <StatCard label="Variabel rule" value={ruleVariables.length} hint="Fakta bertipe yang tersedia untuk kondisi rule." />
            <StatCard label="Kebijakan pemeringkatan" value={gradePolicies.length} hint={`${gradeRangeCount} rentang peringkat telah diatur.`} />
          </div>
          <div className="decision-model-hero-progress">
            <ProgressIndicator value={overallProgress} label="Kesiapan workspace" hint="Dihitung dari pengaturan tipe keputusan, pemeringkatan, TOPSIS, Rule Base, jawaban alternatif, dan ketersediaan rekomendasi." tone="accent" />
            <ProgressIndicator value={evaluationProgress} label="Cakupan jawaban TOPSIS" hint={`${completedEvaluationCells} dari ${expectedEvaluationCells} jawaban TOPSIS yang diharapkan sudah terisi.`} tone={evaluationProgress === 100 ? 'success' : 'warning'} />
            <ProgressIndicator value={Math.round(Math.min(totalWeight, 1) * 100)} label="Keseimbangan bobot kriteria" hint={isWeightBalanced ? 'Total bobot TOPSIS sudah seimbang.' : `Total bobot saat ini ${formatPercent(totalWeight)} dan seharusnya mencapai 100%.`} tone={isWeightBalanced ? 'success' : 'warning'} />
          </div>
        </SectionCard>

        <SectionCard title="Snapshot sistem terbaru">
          <div className="decision-model-snapshot-list">
            <div className="decision-model-snapshot-item"><span>Status rule engine</span><StatusBadge status={rules.length && ruleVariables.length ? 'ready' : ruleVariables.length || rules.length ? 'warning' : 'pending'} /></div>
            <div className="decision-model-snapshot-item"><span>Output rekomendasi</span><StatusBadge status={results.length ? 'ready' : 'pending'} /></div>
            <div className="decision-model-snapshot-item"><span>Cakupan TOPSIS</span><strong>{completedEvaluationCells}/{expectedEvaluationCells || 0}</strong></div>
            <div className="decision-model-snapshot-item"><span>Cakupan jawaban rule</span><strong>{totalRuleEvaluations}/{expectedRuleEvaluations || 0}</strong></div>
            <div className="decision-model-snapshot-item"><span>Buka tampilan rekomendasi</span><Link to={`/decision-models/${decisionModelId}/recommendation`} className="button button-ghost">Buka</Link></div>
          </div>
        </SectionCard>
      </section>

      <section className="decision-model-workspace-grid">
        {workspaceGroups.map((group) => (
          <SectionCard key={group.key} title={group.title} description={group.description} className="decision-model-workspace-card">
            <ProgressIndicator value={group.progress} label="Kesiapan grup" hint="Gunakan indikator ini untuk melihat area yang masih perlu dilengkapi." tone={group.progress === 100 ? 'success' : group.progress > 0 ? 'warning' : 'default'} />
            <div className="decision-model-workspace-links">
              {group.items.map((item) => (
                <Link key={item.label} to={item.href} className="workflow-link">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.count}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
            </div>
          </SectionCard>
        ))}
      </section>

      <Modal
        open={editOpen}
        title="Ubah model keputusan"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="detail-decision-model-form" disabled={isSubmitting || updateMutation.isPending}>
              Simpan perubahan
            </Button>
          </>
        }
      >
        <form id="detail-decision-model-form" className="stack-md" onSubmit={handleUpdate}>
          <FormField label="Nama model" error={errors.name?.message}>
            <TextField placeholder="Seleksi beasiswa 2026" {...register('name')} />
          </FormField>
          <FormField label="Deskripsi" hint="Opsional" error={errors.descriptions?.message}>
            <textarea className="input textarea" rows="4" placeholder="Jelaskan keputusan yang didukung model ini." {...register('descriptions')} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Hapus model keputusan"
        description={`Hapus ${model.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Hapus model'}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
