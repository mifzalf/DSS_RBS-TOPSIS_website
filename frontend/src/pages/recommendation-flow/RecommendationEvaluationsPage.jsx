import { useState } from 'react'
import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { RecommendationFlowNav } from '../../components/navigation/RecommendationFlowNav'
import { Button } from '../../components/ui/Button'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { ImportWizard } from '../../components/import/ImportWizard'
import { useDecisionModel, useDecisionModels } from '../../features/decision-model/useDecisionModels'
import { IMPORT_KINDS } from '../../features/import/import.constants'
import { useAlternatives } from '../../features/alternatives/useAlternatives'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { useEvaluationOverview } from '../../features/evaluation/useEvaluationOverview'
import { useCreateEvaluation, useDeleteEvaluation, useUpdateEvaluation } from '../../features/evaluation/useEvaluations'
import { useRuleVariables } from '../../features/rule-variable/useRuleVariables'
import { useDeleteRuleEvaluation, useRuleEvaluations, useUpsertRuleEvaluation } from '../../features/rule-evaluation/useRuleEvaluations'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

/* ----- RBS helpers ----- */
function getInitialRbsValue(variable) {
  if (variable.value_type === 'boolean') return 'false'
  return ''
}

function getRbsPayload(variable, alternativeId, rawValue) {
  const payload = {
    alternative_id: alternativeId,
    rule_variable_id: variable.id,
    value_boolean: undefined,
    value_number: undefined,
    value_string: undefined,
  }
  if (variable.value_type === 'boolean') payload.value_boolean = rawValue === 'true'
  if (variable.value_type === 'number') payload.value_number = rawValue === '' ? null : Number(rawValue)
  if (variable.value_type === 'string') payload.value_string = rawValue
  return payload
}

function readRbsValue(evaluation, variable) {
  if (!evaluation) return getInitialRbsValue(variable)
  if (variable.value_type === 'boolean') return String(Boolean(evaluation.value_boolean))
  if (variable.value_type === 'number') return evaluation.value_number ?? ''
  return evaluation.value_string ?? ''
}

export function RecommendationEvaluationsPage() {
  const decisionModelId = useDecisionModelId()
  const decisionModelQuery = useDecisionModel(decisionModelId)
  const decisionModelsQuery = useDecisionModels()
  const { pushToast } = useFeedback()
  const [selectedAlternativeId, setSelectedAlternativeId] = useState(null)
  const [rbsDrafts, setRbsDrafts] = useState({})
  const [topsisImportOpen, setTopsisImportOpen] = useState(false)
  const [rbsImportOpen, setRbsImportOpen] = useState(false)

  /* ----- TOPSIS data ----- */
  const criteriaQuery = useCriteriaWithSubCriteria(decisionModelId)
  const alternativesQuery = useAlternatives(decisionModelId)
  const overview = useEvaluationOverview(alternativesQuery.data || [], criteriaQuery.data || [])
  const selectedId = selectedAlternativeId || alternativesQuery.data?.[0]?.id
  const selectedAlternative = (alternativesQuery.data || []).find((item) => item.id === selectedId)
  const selectedOverview = (overview.data || []).find((item) => item.id === selectedId)
  const createTopsisMutation = useCreateEvaluation(selectedId)
  const updateTopsisMutation = useUpdateEvaluation(selectedId)
  const deleteTopsisMutation = useDeleteEvaluation(selectedId)

  /* ----- RBS data ----- */
  const variablesQuery = useRuleVariables(decisionModelId)
  const rbsEvaluationsQuery = useRuleEvaluations(selectedId)
  const upsertRbsMutation = useUpsertRuleEvaluation(selectedId)
  const deleteRbsMutation = useDeleteRuleEvaluation(selectedId)
  const role = decisionModelQuery.data?.role
    || (decisionModelsQuery.data || []).find((item) => String(item.id) === String(decisionModelId))?.role
  const canManage = role === 'owner' || role === 'editor'

  if (criteriaQuery.isLoading || alternativesQuery.isLoading || overview.isLoading || variablesQuery.isLoading || (selectedId && rbsEvaluationsQuery.isLoading)) {
    return <LoadingState title="Memuat evaluasi" description="Menyiapkan matriks TOPSIS dan fakta RBS untuk alternatif terpilih." />
  }

  if (criteriaQuery.error || alternativesQuery.error || variablesQuery.error || rbsEvaluationsQuery.error) {
    return <ErrorState description={criteriaQuery.error?.message || alternativesQuery.error?.message || variablesQuery.error?.message || rbsEvaluationsQuery.error?.message} onAction={() => { criteriaQuery.refetch(); alternativesQuery.refetch(); variablesQuery.refetch(); rbsEvaluationsQuery.refetch?.() }} />
  }

  const criteria = criteriaQuery.data || []
  const alternatives = alternativesQuery.data || []
  const rows = overview.data || []
  const overviewById = new Map(rows.map((row) => [row.id, row]))
  const variables = variablesQuery.data || []
  const rbsEvaluations = rbsEvaluationsQuery.data || []
  const rbsEvaluationsByVariable = new Map(rbsEvaluations.map((item) => [item.rule_variable_id, item]))

  const topsisEvaluationsByCriteria = new Map((selectedOverview?.evaluations || []).map((item) => [item.criteria_id, item]))

  const handleSelectSubCriteria = async (criteriaItem, subCriteriaId) => {
    const existing = topsisEvaluationsByCriteria.get(criteriaItem.id)
    try {
      if (!subCriteriaId) {
        if (existing) {
          await deleteTopsisMutation.mutateAsync(existing.id)
          pushToast({ title: 'Evaluasi dihapus', description: `${criteriaItem.name} berhasil dikosongkan.`, tone: 'success' })
        }
        return
      }
      const payload = { alternative_id: selectedId, criteria_id: criteriaItem.id, sub_criteria_id: Number(subCriteriaId) }
      if (existing) {
        await updateTopsisMutation.mutateAsync({ id: existing.id, payload: { sub_criteria_id: Number(subCriteriaId) } })
        pushToast({ title: 'Evaluasi diperbarui', description: `${criteriaItem.name} berhasil diperbarui.`, tone: 'success' })
      } else {
        await createTopsisMutation.mutateAsync(payload)
        pushToast({ title: 'Evaluasi disimpan', description: `${criteriaItem.name} berhasil dicatat.`, tone: 'success' })
      }
    } catch (submitError) {
      pushToast({ title: 'Permintaan evaluasi gagal', description: submitError.message, tone: 'error' })
    }
  }

  const saveRbsValue = async (variable) => {
    const currentEvaluation = rbsEvaluationsByVariable.get(variable.id)
    const rawValue = rbsDrafts[variable.id] ?? readRbsValue(currentEvaluation, variable)
    try {
      await upsertRbsMutation.mutateAsync({
        id: currentEvaluation?.id,
        payload: getRbsPayload(variable, selectedId, rawValue),
      })
      pushToast({ title: 'Evaluasi rule disimpan', description: `${variable.name} berhasil diperbarui.`, tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Gagal menyimpan evaluasi rule', description: error.message, tone: 'error' })
    }
  }

  const clearRbsValue = async (variable) => {
    const currentEvaluation = rbsEvaluationsByVariable.get(variable.id)
    if (!currentEvaluation) return
    try {
      await deleteRbsMutation.mutateAsync(currentEvaluation.id)
      pushToast({ title: 'Evaluasi rule dihapus', description: `${variable.name} berhasil dikosongkan.`, tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Gagal menghapus evaluasi rule', description: error.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <RecommendationFlowNav />
      <PageHeader
        eyebrow="Langkah 2/3"
        title="Evaluasi alternatif"
        description="Isi jawaban kelayakan (RBS) lalu penilaian TOPSIS untuk alternatif yang dipilih dalam satu halaman."
      />

      {canManage ? (
        <SectionCard
          title="Bulk Import"
          description="Unggah file Excel untuk mengisi banyak evaluasi sekaligus. Template di-generate otomatis dari konfigurasi decision model saat ini."
        >
          <div className="import-action-row">
            <Button type="button" variant="secondary" onClick={() => setRbsImportOpen(true)}>Import Evaluasi RBS (Excel)</Button>
            <Button type="button" variant="secondary" onClick={() => setTopsisImportOpen(true)}>Import Evaluasi TOPSIS (Excel)</Button>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Pilih alternatif">
        <div className="alternative-chip-list">
          {alternatives.map((alternative) => {
            const row = overviewById.get(alternative.id)
            const count = row ? `${row.completed}/${row.expected}` : '0/0'

            return (
              <button key={alternative.id} type="button" className={`decision-model-tab ${selectedId === alternative.id ? 'active' : ''}`} onClick={() => setSelectedAlternativeId(alternative.id)}>
                <span>{alternative.name}</span>
                <small className="decision-model-tab-meta">{count}</small>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title={selectedAlternative ? `RBS — ${selectedAlternative.name}` : 'Evaluasi Kelayakan'} description="Isi fakta bertipe untuk setiap variabel rule yang berlaku pada alternatif ini.">
        <div className="rule-evaluation-grid">
          {variables.map((variable) => {
            const currentEvaluation = rbsEvaluationsByVariable.get(variable.id)
            const currentValue = rbsDrafts[variable.id] ?? readRbsValue(currentEvaluation, variable)
            return (
              <article key={variable.id} className="rule-evaluation-card">
                <div>
                  <strong>{variable.code} — {variable.name}</strong>
                  <p>{variable.value_type}{variable.description ? ` · ${variable.description}` : ''}</p>
                </div>
                <div className="rule-evaluation-card-inputs">
                  {variable.value_type === 'boolean' ? (
                    <DropdownSelect
                      value={currentValue}
                      disabled={!canManage}
                      onChange={(nextValue) => setRbsDrafts((state) => ({ ...state, [variable.id]: nextValue }))}
                      placeholder="Pilih nilai"
                      options={[{ value: 'false', label: 'Tidak' }, { value: 'true', label: 'Ya' }]}
                    />
                  ) : variable.value_type === 'number' ? (
                    <input className="input" type="number" value={currentValue} onChange={(event) => setRbsDrafts((state) => ({ ...state, [variable.id]: event.target.value }))} placeholder="Masukkan nilai angka" disabled={!canManage} />
                  ) : (
                    <input className="input" type="text" value={currentValue} onChange={(event) => setRbsDrafts((state) => ({ ...state, [variable.id]: event.target.value }))} placeholder="Masukkan nilai teks" disabled={!canManage} />
                  )}
                  {canManage ? (
                    <div className="evaluation-card-actions">
                      <Button type="button" onClick={() => saveRbsValue(variable)} disabled={upsertRbsMutation.isPending}>Simpan</Button>
                      {currentEvaluation ? <Button type="button" variant="ghost" onClick={() => clearRbsValue(variable)}>Kosongkan</Button> : null}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title={selectedAlternative ? `TOPSIS — ${selectedAlternative.name}` : 'Evaluasi TOPSIS'} description="Pilih sub-kriteria untuk setiap kriteria penilaian berikut.">
        <div className="evaluation-row-list">
          {criteria.map((criteriaItem) => {
            const existing = topsisEvaluationsByCriteria.get(criteriaItem.id)
            const selectedValue = existing?.sub_criteria_id ? String(existing.sub_criteria_id) : ''
            return (
              <article key={criteriaItem.id} className="rule-evaluation-card">
                <div>
                  <strong>{criteriaItem.code || 'C'} — {criteriaItem.name}</strong>
                  <p>{criteriaItem.type} · bobot {criteriaItem.weight}</p>
                </div>
                <div className="rule-evaluation-card-inputs">
                  <DropdownSelect
                    value={selectedValue}
                    disabled={!canManage}
                    onChange={(nextValue) => handleSelectSubCriteria(criteriaItem, nextValue)}
                    placeholder="Pilih sub-kriteria"
                    options={[
                      { value: '', label: 'Pilih sub-kriteria' },
                      ...criteriaItem.subCriteria.map((sub) => ({ value: String(sub.id), label: `${sub.label} (nilai ${sub.value})` })),
                    ]}
                  />
                  {canManage && existing ? (
                    <div className="evaluation-card-actions">
                      <Button type="button" variant="ghost" onClick={() => handleSelectSubCriteria(criteriaItem, '')}>Kosongkan</Button>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </SectionCard>

      <ImportWizard
        open={topsisImportOpen}
        decisionModelId={decisionModelId}
        kind={IMPORT_KINDS.TOPSIS_EVALUATIONS}
        onClose={() => setTopsisImportOpen(false)}
      />
      <ImportWizard
        open={rbsImportOpen}
        decisionModelId={decisionModelId}
        kind={IMPORT_KINDS.RULE_EVALUATIONS}
        onClose={() => setRbsImportOpen(false)}
      />
    </div>
  )
}
