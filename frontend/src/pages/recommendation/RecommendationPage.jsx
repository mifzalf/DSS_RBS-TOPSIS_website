import { useFeedback } from '../../app/providers/useFeedback'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useGenerateRecommendation } from '../../features/recommendation/useGenerateRecommendation'
import { useResults } from '../../features/result/useResults'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { formatDecimal } from '../../utils/format'

export function RecommendationPage() {
  const decisionModelId = useDecisionModelId()
  const { pushToast } = useFeedback()
  const resultsQuery = useResults(decisionModelId)
  const generateMutation = useGenerateRecommendation(decisionModelId)

  if (resultsQuery.isLoading) {
    return <LoadingState title="Loading recommendation view" description="Checking whether the latest ranking has already been generated." />
  }

  if (resultsQuery.error) {
    return <ErrorState description={resultsQuery.error.message} onAction={resultsQuery.refetch} />
  }

  const onGenerate = async () => {
    try {
      await generateMutation.mutateAsync()
      pushToast({ title: 'Recommendation generated', description: 'Latest results have been refreshed for presentation.', tone: 'success' })
      resultsQuery.refetch()
    } catch (error) {
      pushToast({ title: 'Generation failed', description: error.message, tone: 'error' })
    }
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Recommendation" />
      <PageHeader
        eyebrow="Recommendation"
        title="Generate a final view that is easy to compare, explain, and screenshot."
        description="The layout prioritizes loading clarity, ranked outcomes, and a clean presentation block for stakeholder review."
        actions={
          <Button type="button" onClick={onGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Generating...' : 'Generate recommendation'}
          </Button>
        }
      />
      <SectionCard title="Presentation view" description="Clean enough for meetings, still detailed enough for internal validation.">
        <div className="presentation-card">
          <h2>Final ranking</h2>
          <p>Refresh results whenever criteria, evaluations, or rules change.</p>
          <DataTable
            columns={[
              { key: 'rank', header: 'Rank' },
              { key: 'alternative_name', header: 'Alternative' },
              { key: 'category', header: 'Category' },
              { key: 'score', header: 'Score', render: (row) => formatDecimal(row.score || row.preference_score) },
            ]}
            rows={resultsQuery.data || []}
            emptyMessage="No recommendation has been generated yet."
          />
        </div>
      </SectionCard>
    </div>
  )
}
