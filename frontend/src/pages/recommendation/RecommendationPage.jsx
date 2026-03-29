import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFeedback } from '../../app/providers/useFeedback'
import { DataTable } from '../../components/data-display/DataTable'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/feedback/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { queryKeys } from '../../constants/queryKeys'
import { useGenerateRecommendation } from '../../features/recommendation/useGenerateRecommendation'
import { useResults } from '../../features/result/useResults'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { formatDecimal } from '../../utils/format'

function groupResultsFromFlat(results) {
  const grouped = new Map()

  results.forEach((item) => {
    const category = item.category || 'Not eligible'
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category).push(item)
  })

  const groups = Array.from(grouped.entries()).map(([category, items]) => ({ category, items }))

  return {
    ranked_groups: groups.filter((group) => group.items.some((item) => item.preference_score != null || item.rank != null)),
    rejected_groups: groups.filter((group) => group.items.every((item) => item.preference_score == null && item.rank == null)),
  }
}

export function RecommendationPage() {
  const decisionModelId = useDecisionModelId()
  const queryClient = useQueryClient()
  const { pushToast } = useFeedback()
  const generateMutation = useGenerateRecommendation(decisionModelId)
  const resultsQuery = useResults(decisionModelId)
  const cachedRecommendation = queryClient.getQueryData(queryKeys.recommendation(decisionModelId))

  const recommendation = useMemo(() => {
    if (cachedRecommendation) {
      return cachedRecommendation
    }

    if (!resultsQuery.data?.length) {
      return null
    }

    const grouped = groupResultsFromFlat(resultsQuery.data)

    return {
      data: grouped,
      meta: {
        count: resultsQuery.data.length,
        flat_results: resultsQuery.data,
      },
    }
  }, [cachedRecommendation, resultsQuery.data])

  if (resultsQuery.isLoading) {
    return <LoadingState title="Preparing recommendations" description="Collecting the latest grouped outcomes for this program." />
  }

  const onGenerate = async () => {
    try {
      await generateMutation.mutateAsync()
      pushToast({ title: 'Recommendations updated', description: 'The latest grouped outcomes are now ready to review.', tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Unable to update recommendations', description: error.message, tone: 'error' })
    }
  }

  const rankedGroups = recommendation?.data?.ranked_groups || []
  const rejectedGroups = recommendation?.data?.rejected_groups || []
  const meta = recommendation?.meta

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Recommendations" />
      <PageHeader
        eyebrow="Recommendation"
        title="Review the final recommendation for each assistance group."
        description="See which households are prioritized in each group and which households are not recommended for assistance."
        actions={
          <Button type="button" onClick={onGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Updating recommendations...' : 'Refresh recommendations'}
          </Button>
        }
      />
      <SectionCard title="Recommendation summary" description="Households are grouped first, then eligible groups are prioritized automatically.">
        {recommendation ? (
          <div className="recommendation-summary-grid">
            <article className="mini-card"><strong>Program</strong><p>{meta?.decisionModel?.name || '-'}</p></article>
            <article className="mini-card"><strong>Total households reviewed</strong><p>{meta?.count || 0}</p></article>
            <article className="mini-card"><strong>Priority groups</strong><p>{rankedGroups.length}</p></article>
            <article className="mini-card"><strong>Not recommended groups</strong><p>{rejectedGroups.length}</p></article>
          </div>
        ) : (
          <EmptyState title="No recommendation yet" description="Refresh the recommendation to see the latest grouped outcome for this program." />
        )}
      </SectionCard>

      {rankedGroups.map((group) => (
        <SectionCard key={`ranked-${group.category}`} title={group.category} description="This assistance group shows households in priority order.">
          <div className="recommendation-group-head">
            <Badge tone="success">priority list</Badge>
            <span>{group.items.length} households</span>
          </div>
          <DataTable
            columns={[
              { key: 'rank', header: 'Rank' },
              { key: 'alternative', header: 'Household', render: (row) => row.alternative?.name || `Household ${row.alternative?.id}` },
              { key: 'status', header: 'Status', render: (row) => <Badge tone="success">{row.status || 'ranked'}</Badge> },
              { key: 'preference_score', header: 'Priority score', render: (row) => formatDecimal(row.preference_score) },
            ]}
            rows={group.items}
          />
        </SectionCard>
      ))}

      {rejectedGroups.map((group) => (
        <SectionCard key={`rejected-${group.category}`} title={group.category} description="Households in this group are not included in priority ranking.">
          <div className="recommendation-group-head">
            <Badge tone="warning">not recommended</Badge>
            <span>{group.items.length} households</span>
          </div>
          <div className="recommendation-rejected-list">
            {group.items.map((item) => (
              <article key={`${group.category}-${item.alternative?.id}`} className="mini-card recommendation-rejected-item">
                <strong>{item.alternative?.name || `Household ${item.alternative?.id}`}</strong>
                <Badge tone="warning">{item.status || 'reject'}</Badge>
              </article>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
