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
    return <LoadingState title="Loading recommendation view" description="Checking saved result data and grouped recommendation output." />
  }

  const onGenerate = async () => {
    try {
      await generateMutation.mutateAsync()
      pushToast({ title: 'DSS calculation completed', description: 'Grouped ranked and rejected recommendation output has been refreshed.', tone: 'success' })
    } catch (error) {
      pushToast({ title: 'Generation failed', description: error.message, tone: 'error' })
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
        title="Generate a final view that is easy to compare, explain, and screenshot."
        description="The layout prioritizes loading clarity, ranked outcomes, and a clean presentation block for stakeholder review."
        actions={
          <Button type="button" onClick={onGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Running DSS calculation...' : 'Run DSS calculation'}
          </Button>
        }
      />
      <SectionCard title="Recommendation summary" description="RBS now classifies and groups alternatives before TOPSIS ranks the eligible groups.">
        {recommendation ? (
          <div className="recommendation-summary-grid">
            <article className="mini-card"><strong>Decision model</strong><p>{meta?.decisionModel?.name || '-'}</p></article>
            <article className="mini-card"><strong>Total grouped results</strong><p>{meta?.count || 0}</p></article>
            <article className="mini-card"><strong>Ranked groups</strong><p>{rankedGroups.length}</p></article>
            <article className="mini-card"><strong>Rejected groups</strong><p>{rejectedGroups.length}</p></article>
          </div>
        ) : (
          <EmptyState title="No recommendation snapshot yet" description="Generate a recommendation to load ranked and rejected groups from the latest backend flow." />
        )}
      </SectionCard>

      {rankedGroups.map((group) => (
        <SectionCard key={`ranked-${group.category}`} title={group.category} description="Eligible group ranked by TOPSIS preference score.">
          <div className="recommendation-group-head">
            <Badge tone="success">ranked</Badge>
            <span>{group.items.length} alternatives</span>
          </div>
          <DataTable
            columns={[
              { key: 'rank', header: 'Rank' },
              { key: 'alternative', header: 'Alternative', render: (row) => row.alternative?.name || `Alternative ${row.alternative?.id}` },
              { key: 'status', header: 'Status', render: (row) => <Badge tone="success">{row.status || 'ranked'}</Badge> },
              { key: 'preference_score', header: 'Score', render: (row) => formatDecimal(row.preference_score) },
            ]}
            rows={group.items}
          />
        </SectionCard>
      ))}

      {rejectedGroups.map((group) => (
        <SectionCard key={`rejected-${group.category}`} title={group.category} description="Rejected group stays outside TOPSIS ranking and does not receive a score.">
          <div className="recommendation-group-head">
            <Badge tone="warning">rejected</Badge>
            <span>{group.items.length} alternatives</span>
          </div>
          <div className="recommendation-rejected-list">
            {group.items.map((item) => (
              <article key={`${group.category}-${item.alternative?.id}`} className="mini-card recommendation-rejected-item">
                <strong>{item.alternative?.name || `Alternative ${item.alternative?.id}`}</strong>
                <Badge tone="warning">{item.status || 'reject'}</Badge>
              </article>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
