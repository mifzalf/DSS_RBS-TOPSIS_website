import { useState } from 'react'
import { useFeedback } from '../../app/providers/useFeedback'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Button } from '../../components/ui/Button'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAlternatives } from '../../features/alternatives/useAlternatives'
import { useDeleteRuleEvaluation, useRuleEvaluations, useUpsertRuleEvaluation } from '../../features/rule-evaluation/useRuleEvaluations'
import { useRuleVariables } from '../../features/rule-variable/useRuleVariables'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

function getInitialValue(variable) {
  if (variable.value_type === 'boolean') return 'false'
  return ''
}

function getPayload(variable, alternativeId, rawValue) {
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

function readValue(evaluation, variable) {
  if (!evaluation) return getInitialValue(variable)
  if (variable.value_type === 'boolean') return String(Boolean(evaluation.value_boolean))
  if (variable.value_type === 'number') return evaluation.value_number ?? ''
  return evaluation.value_string ?? ''
}

export function RuleEvaluationsPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const [selectedAlternativeId, setSelectedAlternativeId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const alternativesQuery = useAlternatives(decisionModelId)
  const variablesQuery = useRuleVariables(decisionModelId)
  const alternatives = alternativesQuery.data || []
  const selectedId = selectedAlternativeId || alternatives[0]?.id
  const evaluationsQuery = useRuleEvaluations(selectedId)
  const upsertMutation = useUpsertRuleEvaluation(selectedId)
  const deleteMutation = useDeleteRuleEvaluation(selectedId)

  if (alternativesQuery.isLoading || variablesQuery.isLoading || (selectedId && evaluationsQuery.isLoading)) {
    return <LoadingState title="Memuat evaluasi rule" description="Menyiapkan alternatif dan nilai fakta bertipe untuk input RBS." />
  }

  if (alternativesQuery.error || variablesQuery.error || evaluationsQuery.error) {
    return <ErrorState description={alternativesQuery.error?.message || variablesQuery.error?.message || evaluationsQuery.error?.message} onAction={() => { alternativesQuery.refetch(); variablesQuery.refetch(); evaluationsQuery.refetch?.() }} />
  }

  const variables = variablesQuery.data || []
  const evaluations = evaluationsQuery.data || []
  const evaluationsByVariable = new Map(evaluations.map((item) => [item.rule_variable_id, item]))

  const saveValue = async (variable) => {
    const currentEvaluation = evaluationsByVariable.get(variable.id)
    const rawValue = drafts[variable.id] ?? readValue(currentEvaluation, variable)

    try {
      await upsertMutation.mutateAsync({
        id: currentEvaluation?.id,
        payload: currentEvaluation?.id ? getPayload(variable, selectedId, rawValue) : getPayload(variable, selectedId, rawValue),
      })
      pushToast({ title: 'Evaluasi rule disimpan', description: `${variable.name} berhasil diperbarui untuk alternatif terpilih.`, tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Gagal menyimpan evaluasi rule', description: error.message, tone: 'error' })
    }
  }

  const clearValue = async (variable) => {
    const currentEvaluation = evaluationsByVariable.get(variable.id)
    if (!currentEvaluation) return
    try {
      await deleteMutation.mutateAsync(currentEvaluation.id)
      pushToast({ title: 'Evaluasi rule dihapus', description: `${variable.name} berhasil dikosongkan untuk alternatif terpilih.`, tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Gagal menghapus evaluasi rule', description: error.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Evaluasi Rule" title="Isi evaluasi berbasis rule" />
      <SectionCard title="Pilih alternatif">
        {alternatives.length ? (
          <div className="alternative-chip-list">
            {alternatives.map((alternative) => (
              <button key={alternative.id} type="button" className={`decision-model-tab ${selectedId === alternative.id ? 'active' : ''}`} onClick={() => setSelectedAlternativeId(alternative.id)}>
                {alternative.name}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada alternatif" description="Tambahkan alternatif sebelum mengisi evaluasi rule." />
        )}
      </SectionCard>
      <SectionCard title="Matriks fakta bertipe">
        {variables.length ? (
          <div className="rule-evaluation-grid">
            {variables.map((variable) => {
              const currentEvaluation = evaluationsByVariable.get(variable.id)
              const currentValue = drafts[variable.id] ?? readValue(currentEvaluation, variable)

              return (
                <article key={variable.id} className="rule-evaluation-card">
                  <div>
                    <strong>{variable.code} - {variable.name}</strong>
                      <p>{variable.description || 'Belum ada deskripsi.'}</p>
                  </div>
                  <span className="badge badge-info">{variable.value_type}</span>
                  {variable.value_type === 'boolean' ? (
                    <DropdownSelect
                      value={currentValue}
                      onChange={(nextValue) => setDrafts((state) => ({ ...state, [variable.id]: nextValue }))}
                        placeholder="Pilih nilai"
                        options={[
                          { value: 'false', label: 'Tidak' },
                          { value: 'true', label: 'Ya' },
                        ]}
                     />
                   ) : variable.value_type === 'number' ? (
                     <input className="input" type="number" value={currentValue} onChange={(event) => setDrafts((state) => ({ ...state, [variable.id]: event.target.value }))} placeholder="Masukkan nilai angka" />
                   ) : (
                     <input className="input" value={currentValue} onChange={(event) => setDrafts((state) => ({ ...state, [variable.id]: event.target.value }))} placeholder="Masukkan nilai teks" />
                   )}
                   <div className="rule-evaluation-card-actions">
                     <Button type="button" variant="secondary" onClick={() => saveValue(variable)} disabled={upsertMutation.isPending}>Simpan nilai</Button>
                     <Button type="button" variant="ghost" onClick={() => clearValue(variable)} disabled={!currentEvaluation || deleteMutation.isPending}>Kosongkan</Button>
                   </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState title="Belum ada variabel rule" description="Buat variabel rule terlebih dahulu agar input bertipe dapat ditampilkan." />
        )}
      </SectionCard>
    </div>
  )
}
