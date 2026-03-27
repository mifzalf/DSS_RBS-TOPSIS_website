import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useResults } from '../../features/result/useResults'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { formatDecimal } from '../../utils/format'

export function ResultsPage() {
  const decisionModelId = useDecisionModelId()
  const { data = [], isLoading, error, refetch } = useResults(decisionModelId)

  if (isLoading) {
    return <LoadingState title="Loading results" description="Collecting ranked alternatives and preference scores." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Results" />
      <PageHeader eyebrow="Results" title="Ranking output stays comparison-ready for analysis and presentation." description="The table is optimized for rank, alternative, category, and preference score scanning." />
      <SectionCard title="Ranking table" description="A clear baseline for filters, sorting, and export-ready views.">
        <DataTable
          columns={[
            { key: 'rank', header: 'Rank' },
            { key: 'alternative_name', header: 'Alternative' },
            { key: 'category', header: 'Category' },
            { key: 'score', header: 'Preference score', render: (row) => formatDecimal(row.score || row.preference_score) },
          ]}
          rows={data}
        />
      </SectionCard>
    </div>
  )
}
