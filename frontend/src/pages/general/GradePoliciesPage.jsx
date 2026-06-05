import { useState } from 'react'
import { useFeedback } from '../../app/providers/useFeedback'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useGradePolicies } from '../../features/grade-policies/useGradePolicies'
import { useUpdateGradeRange } from '../../features/grade-policies/useGradeRanges'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

export function GradePoliciesPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const { data = [], isLoading, error, refetch } = useGradePolicies(decisionModelId)
  const updateRangeMutation = useUpdateGradeRange(decisionModelId)
  const [drafts, setDrafts] = useState({})

  if (isLoading) {
    return <LoadingState title="Memuat kebijakan pemeringkatan" description="Menyiapkan kebijakan pemeringkatan dan rentang nilai untuk model ini." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  const saveRange = async (range) => {
    const draft = drafts[range.id] || {}
    const maxRaw = draft.max ?? range.max_score ?? ''

    if (maxRaw === '' || maxRaw === null) {
      pushToast({ title: 'Batas maksimum wajib diisi', description: `Isi batas maks untuk ${range.label}.`, tone: 'error' })
      return
    }

    try {
      // Catatan: kolom `code` sengaja TIDAK dikirim. `code` adalah kunci
      // canonical (mis. 'high_priority', 'medium_priority', dst) yang dipakai
      // di seluruh aplikasi untuk pewarnaan badge, ikon, dan logika downstream.
      // Menurunkannya dari label akan merusak pemetaan tone di halaman hasil
      // rekomendasi setiap kali user mengganti label/tier.
      await updateRangeMutation.mutateAsync({
        id: range.id,
        payload: {
          label: range.label,
          max_score: Number(maxRaw),
          sort_order: range.sort_order,
          result_status: range.result_status,
        },
      })
      pushToast({ title: 'Rentang disimpan', description: `${range.label} berhasil diperbarui.`, tone: 'success' })
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[range.id]
        return next
      })
    } catch (submitError) {
      pushToast({ title: 'Gagal menyimpan rentang', description: submitError.message, tone: 'error' })
    }
  }

  const setDraft = (rangeId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [rangeId]: { ...prev[rangeId], [field]: value },
    }))
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Kebijakan Pemeringkatan"
        title="Kelola pemeringkatan"
        description="Cukup atur batas maksimum tiap tier. Batas bawah dihitung otomatis dari tier di bawahnya, sehingga tidak ada gap maupun tumpang tindih."
      />

      <SectionCard title="Daftar kebijakan">
        {data.length ? (
          <div className="grade-policy-list">
            {data.map((policy) => (
              <article key={policy.id} className="rule-card">
                <div className="rule-card-head">
                  <div>
                    <strong>{policy.categoryRef?.name || `Kategori #${policy.category_id}`}</strong>
                    <p>Hasil {policy.applies_to_status === 'ranked' ? 'diperingkat' : 'ditolak'}</p>
                  </div>
                  <div className="rule-card-badges">
                    <Badge tone={policy.applies_to_status === 'ranked' ? 'success' : 'warning'}>{policy.applies_to_status === 'ranked' ? 'diperingkat' : 'ditolak'}</Badge>
                  </div>
                </div>

                <div className="grade-range-list">
                  {policy.ranges?.length ? (
                    policy.ranges
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((range) => {
                        const draft = drafts[range.id] || {}
                        const maxValue = draft.max !== undefined ? draft.max : (range.max_score ?? '')

                        return (
                          <div key={range.id} className="grade-range-item">
                            <div>
                              <strong>{range.label}</strong>
                              <Badge tone={range.result_status === 'rejected' ? 'warning' : 'success'}>{range.result_status === 'rejected' ? 'Ditolak' : 'Diperingkat'}</Badge>
                            </div>
                            <div className="grade-range-fields">
                              <label className="grade-range-field">
                                <span>Maks</span>
                                <input
                                  className="input"
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={maxValue}
                                  onChange={(e) => setDraft(range.id, 'max', e.target.value)}
                                  placeholder="1"
                                />
                              </label>
                              <Button type="button" onClick={() => saveRange(range)} disabled={updateRangeMutation.isPending}>
                                Simpan
                              </Button>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <EmptyState title="Belum ada rentang" description="Rentang akan otomatis disiapkan oleh sistem." />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Menyiapkan kebijakan" description="Kebijakan pemeringkatan akan otomatis disiapkan untuk setiap kategori." />
        )}
      </SectionCard>
    </div>
  )
}
