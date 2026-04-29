import { useState } from 'react'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Button } from '../../components/ui/Button'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressIndicator } from '../../components/ui/ProgressIndicator'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAlternatives } from '../../features/alternatives/useAlternatives'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { useEvaluationOverview } from '../../features/evaluation/useEvaluationOverview'
import { useCreateEvaluation, useDeleteEvaluation, useUpdateEvaluation } from '../../features/evaluation/useEvaluations'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

export function EvaluationsPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [selectedAlternativeId, setSelectedAlternativeId] = useState(null)
  const criteriaQuery = useCriteriaWithSubCriteria(decisionModelId)
  const alternativesQuery = useAlternatives(decisionModelId)
  const overview = useEvaluationOverview(alternativesQuery.data || [], criteriaQuery.data || [])
  const selectedId = selectedAlternativeId || alternativesQuery.data?.[0]?.id
  const selectedAlternative = (alternativesQuery.data || []).find((item) => item.id === selectedId)
  const selectedOverview = (overview.data || []).find((item) => item.id === selectedId)
  const createMutation = useCreateEvaluation(selectedId)
  const updateMutation = useUpdateEvaluation(selectedId)
  const deleteMutation = useDeleteEvaluation(selectedId)

  if (criteriaQuery.isLoading || alternativesQuery.isLoading || overview.isLoading) {
    return <LoadingState title="Memuat matriks evaluasi" description="Menghitung kelengkapan data pada alternatif dan kriteria." />
  }

  if (criteriaQuery.error || alternativesQuery.error) {
    return <ErrorState description={criteriaQuery.error?.message || alternativesQuery.error?.message} onAction={() => { criteriaQuery.refetch(); alternativesQuery.refetch() }} />
  }

  const criteria = criteriaQuery.data || []
  const rows = overview.data || []
  const totalCompleted = rows.reduce((sum, row) => sum + row.completed, 0)
  const totalExpected = rows.reduce((sum, row) => sum + row.expected, 0)
  const completeness = totalExpected ? Math.round((totalCompleted / totalExpected) * 100) : 0
  const evaluationsByCriteria = new Map((selectedOverview?.evaluations || []).map((item) => [item.criteria_id, item]))

  const handleSelectSubCriteria = async (criteriaItem, subCriteriaId) => {
    const existing = evaluationsByCriteria.get(criteriaItem.id)

    try {
      if (!subCriteriaId) {
        if (existing) {
          await deleteMutation.mutateAsync(existing.id)
          pushToast({ title: 'Evaluasi dihapus', description: `${criteriaItem.name} berhasil dikosongkan.`, tone: 'success' })
        }
        return
      }

      const payload = {
        alternative_id: selectedId,
        criteria_id: criteriaItem.id,
        sub_criteria_id: Number(subCriteriaId),
      }

      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, payload: { sub_criteria_id: Number(subCriteriaId) } })
        pushToast({ title: 'Evaluasi diperbarui', description: `${criteriaItem.name} berhasil diperbarui.`, tone: 'success' })
      } else {
        await createMutation.mutateAsync(payload)
        pushToast({ title: 'Evaluasi disimpan', description: `${criteriaItem.name} berhasil dicatat.`, tone: 'success' })
      }
    } catch (submitError) {
      pushToast({ title: 'Permintaan evaluasi gagal', description: submitError.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Evaluasi TOPSIS" title="Isi evaluasi TOPSIS" />
      <div className="content-grid two-column">
        <SectionCard title="Kelengkapan">
          <ProgressIndicator value={completeness} label="Cakupan evaluasi" hint={`${totalCompleted} sel terisi dari ${totalExpected} sel yang diharapkan.`} tone={completeness === 100 ? 'success' : 'warning'} />
          <div className="alternative-chip-list">
            {(alternativesQuery.data || []).map((alternative) => (
              <button key={alternative.id} type="button" className={`decision-model-tab ${selectedId === alternative.id ? 'active' : ''}`} onClick={() => setSelectedAlternativeId(alternative.id)}>
                {alternative.name}
              </button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Kesiapan matriks">
          <div className="rule-condition-list">
            {rows.map((row) => (
              <div key={row.id} className="rule-condition-item">
                <strong>{row.name}</strong>
                <span>{row.completed}/{row.expected} terisi</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={selectedAlternative ? `Matriks untuk ${selectedAlternative.name}` : 'Matriks evaluasi'}>
        <div className="evaluation-row-list">
          {criteria.map((criteriaItem) => {
            const existing = evaluationsByCriteria.get(criteriaItem.id)
            const selectedValue = existing?.sub_criteria_id ? String(existing.sub_criteria_id) : ''

            return (
              <article key={criteriaItem.id} className="rule-evaluation-card">
                <div>
                  <strong>{criteriaItem.code || 'C'} - {criteriaItem.name}</strong>
                  <p>{criteriaItem.type} · bobot {criteriaItem.weight}</p>
                </div>
                <DropdownSelect
                  value={selectedValue}
                  onChange={(nextValue) => handleSelectSubCriteria(criteriaItem, nextValue)}
                  placeholder="Pilih sub-kriteria"
                  options={[
                    { value: '', label: 'Pilih sub-kriteria' },
                    ...criteriaItem.subCriteria.map((subCriteria) => ({
                      value: String(subCriteria.id),
                      label: `${subCriteria.label} (nilai ${subCriteria.value})`,
                    })),
                  ]}
                />
                <div className="rule-evaluation-card-actions">
                  <span className={`badge ${existing ? 'badge-success' : 'badge-neutral'}`}>{existing ? 'terisi' : 'kosong'}</span>
                  <Button type="button" variant="ghost" disabled={!existing || deleteMutation.isPending} onClick={() => handleSelectSubCriteria(criteriaItem, '')}>Kosongkan</Button>
                </div>
              </article>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
