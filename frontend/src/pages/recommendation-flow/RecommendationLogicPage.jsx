import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { RecommendationFlowNav } from '../../components/navigation/RecommendationFlowNav'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAssistanceCategories } from '../../features/assistance-categories/useAssistanceCategories'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { useGradePolicies } from '../../features/grade-policies/useGradePolicies'
import { useRulesWithConditions } from '../../features/rule/useRules'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { formatPercent } from '../../utils/format'

function logicLabel(logicType) {
  if (logicType === 'AND') return 'Semua kondisi berikut'
  if (logicType === 'OR') return 'Salah satu kondisi berikut'
  if (logicType === 'EMPTY') return 'Tidak ada syarat khusus'
  return logicType
}

function categoryBadge(category) {
  if (category?.is_ranked) return <Badge tone="success">Diperingkat</Badge>
  return <Badge tone="warning">Ditolak</Badge>
}

export function RecommendationLogicPage() {
  const decisionModelId = useDecisionModelId()
  const criteriaQuery = useCriteriaWithSubCriteria(decisionModelId)
  const categoriesQuery = useAssistanceCategories(decisionModelId)
  const rulesQuery = useRulesWithConditions(decisionModelId)
  const gradePoliciesQuery = useGradePolicies(decisionModelId)

  const isLoading =
    criteriaQuery.isLoading ||
    categoriesQuery.isLoading ||
    rulesQuery.isLoading ||
    gradePoliciesQuery.isLoading

  if (isLoading) {
    return <LoadingState title="Memuat logika DSS" description="Menyusun informasi penilaian, aturan, dan prioritas dalam satu tampilan." />
  }

  const error = criteriaQuery.error || categoriesQuery.error || rulesQuery.error || gradePoliciesQuery.error
  if (error) {
    return <ErrorState description={error.message} onAction={() => { criteriaQuery.refetch(); categoriesQuery.refetch(); rulesQuery.refetch(); gradePoliciesQuery.refetch() }} />
  }

  const criteria = criteriaQuery.data || []
  const categories = categoriesQuery.data || []
  const rules = rulesQuery.data || []
  const gradePolicies = gradePoliciesQuery.data || []
  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0)
  const isBalanced = Math.abs(totalWeight - 1) <= 0.0001

  return (
    <div className="page-stack">
      <RecommendationFlowNav />
      <PageHeader
        eyebrow="Logika DSS"
        title="Logika di balik keputusan"
        description="Tampilan informasi yang menjelaskan faktor penilaian, aturan kelayakan, dan tingkat prioritas yang digunakan dalam sistem ini."
      />

      <SectionCard title="Tipe Keputusan" description="Kelompok yang digunakan untuk mengelompokkan hasil akhir rekomendasi.">
        <div className="logic-category-grid">
          {categories.map((item) => (
            <article key={item.id} className="logic-category-card">
              <div className="logic-category-head">
                <strong>{item.name}</strong>
                {categoryBadge(item)}
              </div>
              {item.description ? <p>{item.description}</p> : <p className="subtle-text">Belum ada deskripsi untuk tipe ini.</p>}
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Aturan Kelayakan" description="Urutan aturan yang menentukan tipe keputusan akhir setiap rumah tangga berdasarkan indikator di atas.">
        <div className="logic-rule-list">
          {rules.length ? rules.map((rule) => (
            <article key={rule.id} className="logic-rule-card">
              <div className="logic-rule-head">
                <strong>{rule.name || `Aturan ${rule.priority}`}</strong>
                <Badge tone={rule.action_type === 'reject' ? 'warning' : 'success'}>
                  {rule.categoryRef?.name || `Kategori #${rule.category_id}`}
                </Badge>
              </div>
              <p className="logic-rule-type">Prioritas {rule.priority} · {logicLabel(rule.logic_type)}</p>
              {rule.logic_type !== 'EMPTY' && rule.conditions?.length ? (
                <ul className="logic-rule-conditions">
                  {rule.conditions.map((cond) => (
                    <li key={cond.id}>
                      {cond.ruleVariable?.name || cond.field || 'Kondisi'}
                    </li>
                  ))}
                </ul>
              ) : null}
              {rule.logic_type === 'EMPTY' ? (
                <p className="logic-rule-empty-hint">Aturan ini otomatis berlaku jika tidak ada indikator kelayakan yang terpenuhi.</p>
              ) : null}
            </article>
          )) : <p className="subtle-text">Belum ada aturan kelayakan yang ditentukan.</p>}
        </div>
      </SectionCard>

      <SectionCard title="Faktor Penilaian" description={`Total bobot: ${formatPercent(totalWeight)} — ${isBalanced ? 'Seimbang' : 'Belum seimbang'}`}>
        <div className="logic-criteria-grid">
          {criteria.map((item) => (
            <article key={item.id} className="logic-criteria-card">
              <div className="logic-criteria-head">
                <strong>{item.name}</strong>
                <span className="logic-criteria-weight">{formatPercent(item.weight || 0)}</span>
              </div>
              <div className="progress-track logic-criteria-bar">
                <div className="progress-fill progress-fill-accent" style={{ width: `${(item.weight || 0) * 100}%` }} />
              </div>
              <div className="logic-criteria-levels">
                {(item.subCriteria || []).map((sub) => (
                  <div key={sub.id} className="logic-criteria-level">
                    <span>{sub.label}</span>
                    <span className="logic-level-value">{sub.value}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Tingkat Prioritas" description="Konversi nilai akhir menjadi tingkat prioritas untuk masing-masing tipe keputusan.">
        <div className="logic-grade-grid">
          {gradePolicies.length ? gradePolicies.map((policy) => (
            <article key={policy.id} className="logic-grade-card">
              <div className="logic-grade-head">
                <strong>{policy.categoryRef?.name || `Kategori #${policy.category_id}`}</strong>
                <Badge tone={policy.applies_to_status === 'ranked' ? 'success' : 'warning'}>
                  {policy.applies_to_status === 'ranked' ? 'Diperingkat' : 'Ditolak'}
                </Badge>
              </div>
              {policy.ranges?.length ? (
                <div className="logic-grade-ranges">
                  {policy.ranges.slice().sort((a, b) => a.sort_order - b.sort_order).map((range) => (
                    <div key={range.id} className="logic-grade-range">
                      <div className="logic-grade-range-bar">
                        <span className="logic-grade-label">{range.label}</span>
                        <span className="logic-grade-score-range">
                          {range.min_score != null ? range.min_score.toFixed(2) : '0.00'} — {range.max_score != null ? range.max_score.toFixed(2) : '1.00'}
                        </span>
                      </div>
                      <div className="progress-track logic-grade-track">
                        <div
                          className="progress-fill progress-fill-accent"
                          style={{
                            marginLeft: `${(range.min_score ?? 0) * 100}%`,
                            width: `${((range.max_score ?? 1) - (range.min_score ?? 0)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="subtle-text">Belum ada rentang prioritas.</p>}
            </article>
          )) : <p className="subtle-text">Belum ada kebijakan pemeringkatan yang ditentukan.</p>}
        </div>
      </SectionCard>
    </div>
  )
}
