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

function getGradeTone(gradeCode) {
  if (gradeCode === 'high_priority') return 'success'
  if (gradeCode === 'medium_priority') return 'info'
  if (gradeCode === 'low_priority') return 'warning'
  if (gradeCode === 'not_eligible') return 'neutral'
  return 'neutral'
}

function groupResultsFromFlat(results) {
  const grouped = new Map()

  results.forEach((item) => {
    const key = String(item.category_id || item.category || 'unassigned')
    if (!grouped.has(key)) {
      grouped.set(key, {
        category_id: item.category_id ?? null,
        category: item.category || 'Not eligible',
        action_type: item.status === 'rejected' && item.preference_score == null ? 'reject' : 'assign_benefit',
        status: 'mixed',
        items: [],
      })
    }
    grouped.get(key).items.push(item)
  })

  const groups = Array.from(grouped.values())

  return {
    ranked_groups: groups.filter((group) => group.items.some((item) => item.preference_score != null || item.rank != null)),
    rejected_groups: groups.filter((group) => group.items.every((item) => item.preference_score == null && item.rank == null)),
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

export function RecommendationPage() {
  const decisionModelId = useDecisionModelId()
  const queryClient = useQueryClient()
  const { pushToast } = useFeedback()
  const generateMutation = useGenerateRecommendation(decisionModelId)
  const resultsQuery = useResults(decisionModelId)
  const cachedRecommendation = queryClient.getQueryData(queryKeys.recommendation(decisionModelId))

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
        <SectionCard key={`ranked-${group.category_id || group.category}`} title={group.category} description="This assistance group shows households in priority order, with not eligible outcomes listed separately at the bottom if present.">
          <div className="recommendation-group-head">
            <Badge tone="success">priority list</Badge>
            <Badge tone="info">category #{group.category_id || '-'}</Badge>
            <span>{group.items.length} households</span>
          </div>
          <DataTable
            columns={[
              { key: 'rank', header: 'Rank' },
              { key: 'alternative', header: 'Household', render: (row) => row.alternative?.name || `Household ${row.alternative?.id}` },
              { key: 'grade', header: 'Grade', render: (row) => <Badge tone={getGradeTone(row.grade_code)}>{row.grade_label || '-'}</Badge> },
              { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'rejected' ? 'warning' : 'success'}>{row.status || 'ranked'}</Badge> },
              { key: 'preference_score', header: 'Priority score', render: (row) => row.preference_score == null ? '-' : formatDecimal(row.preference_score) },
            ]}
            rows={[
              ...group.items.filter((item) => item.status !== 'rejected'),
              ...group.items.filter((item) => item.status === 'rejected'),
            ]}
          />
        </SectionCard>
      ))}

      {rejectedGroups.map((group) => (
        <SectionCard key={`rejected-${group.category}`} title={group.category} description="Households in this group are not included in priority ranking.">
          <div className="recommendation-group-head">
            <Badge tone="warning">not recommended</Badge>
            <Badge tone="neutral">category #{group.category_id || '-'}</Badge>
            <span>{group.items.length} households</span>
          </div>
          <div className="recommendation-rejected-list">
            {group.items.map((item) => (
              <article key={`${group.category}-${item.alternative?.id}`} className="mini-card recommendation-rejected-item">
                <div>
                  <strong>{item.alternative?.name || `Household ${item.alternative?.id}`}</strong>
                  <p>{item.grade_label || 'No grade label'}</p>
                </div>
                <div className="recommendation-rejected-badges">
                  <Badge tone={getGradeTone(item.grade_code)}>{item.grade_label || item.grade_code || 'ungraded'}</Badge>
                  <Badge tone="warning">{item.status || 'reject'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
