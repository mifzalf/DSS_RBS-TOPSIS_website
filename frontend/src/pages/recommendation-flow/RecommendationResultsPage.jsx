import { useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFeedback } from '../../app/providers/useFeedback'
import { DataTable } from '../../components/data-display/DataTable'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/feedback/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { RecommendationFlowNav } from '../../components/navigation/RecommendationFlowNav'
import { queryKeys } from '../../constants/queryKeys'
import { useGenerateRecommendation } from '../../features/recommendation/useGenerateRecommendation'
import { useResults } from '../../features/result/useResults'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { formatDecimal } from '../../utils/format'

function getGradeTone(gradeCode) {
  if (gradeCode === 'high_priority') return 'success'
  if (gradeCode === 'medium_priority') return 'info'
  if (gradeCode === 'low_priority') return 'warning'
  if (gradeCode === 'not_eligible') return 'neutral'
  return 'neutral'
}

function resolveCategoryName(item) {
  return (
    item.categoryRef?.name
    || item.category
    || (item.category_id != null ? `Kategori #${item.category_id}` : null)
    || 'Tidak direkomendasikan'
  )
}

function resolveCategoryKey(item) {
  if (item.category_id != null) return `id:${item.category_id}`
  if (item.categoryRef?.name) return `name:${item.categoryRef.name}`
  if (item.category) return `name:${item.category}`
  return 'unassigned'
}

function groupResultsFromFlat(results) {
  const grouped = new Map()

  results.forEach((item) => {
    const key = resolveCategoryKey(item)
    const isRanked = item.categoryRef?.is_ranked
    if (!grouped.has(key)) {
      grouped.set(key, {
        category_id: item.category_id ?? null,
        category: resolveCategoryName(item),
        action_type: isRanked === false ? 'reject' : 'assign_benefit',
        status: 'mixed',
        items: [],
      })
    }
    grouped.get(key).items.push(item)
  })

  const groups = Array.from(grouped.values())

  // Pertama prioritaskan flag is_ranked dari kategori jika tersedia,
  // lalu fallback ke heuristik berbasis preference_score/rank.
  const rankedGroups = []
  const rejectedGroups = []

  for (const group of groups) {
    const hasRankedSignal = group.items.some(
      (item) => item.preference_score != null || item.rank != null,
    )
    const allEmpty = group.items.every(
      (item) => item.preference_score == null && item.rank == null,
    )

    if (group.action_type === 'reject') {
      rejectedGroups.push(group)
    } else if (hasRankedSignal) {
      rankedGroups.push(group)
    } else if (allEmpty) {
      rejectedGroups.push(group)
    } else {
      rankedGroups.push(group)
    }
  }

  return {
    ranked_groups: rankedGroups,
    rejected_groups: rejectedGroups,
  }
}

function normalizeRecommendationGroups(payload) {
  const rankedGroups = (payload?.ranked_groups || []).map((group) => ({
    ...group,
    items: [
      ...(group.items || []).filter((item) => item.status !== 'rejected'),
      ...(group.items || []).filter((item) => item.status === 'rejected'),
    ],
  }))

  const normalizedRejectedGroups = []

  ;(payload?.rejected_groups || []).forEach((group) => {
    const hasMatchingRankedGroup = rankedGroups.some((rankedGroup) => String(rankedGroup.category_id) === String(group.category_id))

    if (hasMatchingRankedGroup) {
      const rankedGroup = rankedGroups.find((entry) => String(entry.category_id) === String(group.category_id))
      rankedGroup.items = [...rankedGroup.items, ...(group.items || [])]
      rankedGroup.items = [
        ...rankedGroup.items.filter((item) => item.status !== 'rejected'),
        ...rankedGroup.items.filter((item) => item.status === 'rejected'),
      ]
    } else {
      normalizedRejectedGroups.push(group)
    }
  })

  return {
    ranked_groups: rankedGroups,
    rejected_groups: normalizedRejectedGroups,
  }
}

export function RecommendationResultsPage() {
  const decisionModelId = useDecisionModelId()
  const queryClient = useQueryClient()
  const { pushToast } = useFeedback()
  const generateMutation = useGenerateRecommendation(decisionModelId)
  const resultsQuery = useResults(decisionModelId)
  const generationCountRef = useRef(0)
  const cachedRecommendation = generateMutation.data || queryClient.getQueryData(queryKeys.recommendation(decisionModelId))

  const recommendation = useMemo(() => {
    if (cachedRecommendation) {
      return {
        ...cachedRecommendation,
        data: normalizeRecommendationGroups(cachedRecommendation.data),
      }
    }

    if (!resultsQuery.data?.length) {
      return null
    }

    const grouped = groupResultsFromFlat(resultsQuery.data)

    return {
      data: normalizeRecommendationGroups(grouped),
      meta: {
        count: resultsQuery.data.length,
        flat_results: resultsQuery.data,
      },
    }
  }, [cachedRecommendation, resultsQuery.data, generationCountRef.current])

  if (resultsQuery.isLoading && !cachedRecommendation && !resultsQuery.data?.length) {
    return <LoadingState title="Menyiapkan rekomendasi" description="Mengumpulkan hasil pengelompokan terbaru untuk program ini." />
  }

  const onGenerate = async () => {
    try {
      queryClient.removeQueries({ queryKey: queryKeys.recommendation(decisionModelId) })
      queryClient.setQueryData(queryKeys.results(decisionModelId), undefined)
      await generateMutation.mutateAsync()
      generationCountRef.current += 1
      pushToast({ title: 'Rekomendasi diperbarui', description: 'Hasil pengelompokan terbaru siap ditinjau.', tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Gagal memperbarui rekomendasi', description: error.message, tone: 'error' })
    }
  }

  const rankedGroups = recommendation?.data?.ranked_groups || []
  const rejectedGroups = recommendation?.data?.rejected_groups || []
  const meta = recommendation?.meta

  return (
    <div className="page-stack">
      <RecommendationFlowNav />
      <PageHeader
        eyebrow="Langkah 3/3"
        title="Hasil rekomendasi"
        description="Tinjau hasil pengelompokan dan prioritas akhir setiap grup bantuan."
        actions={
          <Button type="button" onClick={onGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Memperbarui...' : 'Perbarui rekomendasi'}
          </Button>
        }
      />
      <SectionCard title="Ringkasan rekomendasi">
        {recommendation ? (
          <div className="recommendation-summary-grid">
            <article className="mini-card"><strong>Program</strong><p>{meta?.decisionModel?.name || '-'}</p></article>
            <article className="mini-card"><strong>Total rumah tangga ditinjau</strong><p>{meta?.count || 0}</p></article>
            <article className="mini-card"><strong>Kelompok prioritas</strong><p>{rankedGroups.length}</p></article>
            <article className="mini-card"><strong>Kelompok tidak direkomendasikan</strong><p>{rejectedGroups.length}</p></article>
          </div>
        ) : (
          <EmptyState title="Belum ada rekomendasi" description="Perbarui rekomendasi untuk melihat hasil pengelompokan terbaru pada program ini." />
        )}
      </SectionCard>

      {rankedGroups.map((group) => (
        <SectionCard key={`ranked-${group.category_id || group.category}`} title={group.category}>
          <div className="recommendation-group-head">
            <Badge tone="success">daftar prioritas</Badge>
            <span>{group.items.length} rumah tangga</span>
          </div>
          <DataTable
            columns={[
              { key: 'rank', header: 'Peringkat' },
              { key: 'alternative', header: 'Rumah tangga', render: (row) => row.alternative?.name || `Rumah tangga ${row.alternative?.id}` },
              { key: 'grade', header: 'Grade', render: (row) => <Badge tone={getGradeTone(row.grade_code)}>{row.grade_label || '-'}</Badge> },
              { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'rejected' ? 'warning' : 'success'}>{row.status === 'rejected' ? 'ditolak' : 'diperingkat'}</Badge> },
              { key: 'preference_score', header: 'Nilai preferensi', render: (row) => row.preference_score == null ? '-' : formatDecimal(row.preference_score) },
            ]}
            rows={[
              ...group.items.filter((item) => item.status !== 'rejected'),
              ...group.items.filter((item) => item.status === 'rejected'),
            ]}
          />
        </SectionCard>
      ))}

      {rejectedGroups.map((group) => (
        <SectionCard key={`rejected-${group.category}`} title={group.category}>
          <div className="recommendation-group-head">
            <Badge tone="warning">tidak direkomendasikan</Badge>
            <span>{group.items.length} rumah tangga</span>
          </div>
          <div className="recommendation-rejected-list">
            {group.items.map((item) => (
              <article key={`${group.category}-${item.alternative?.id}`} className="mini-card recommendation-rejected-item">
                <div>
                  <strong>{item.alternative?.name || `Rumah tangga ${item.alternative?.id}`}</strong>
                  <p>{item.grade_label || 'Belum ada label grade'}</p>
                </div>
                <div className="recommendation-rejected-badges">
                  <Badge tone={getGradeTone(item.grade_code)}>{item.grade_label || item.grade_code || 'belum digrade'}</Badge>
                  <Badge tone="warning">{item.status === 'rejected' ? 'ditolak' : 'tolak'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
