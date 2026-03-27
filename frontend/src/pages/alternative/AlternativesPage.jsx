import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAlternatives } from '../../features/alternative/useAlternatives'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { truncateText } from '../../utils/format'

export function AlternativesPage() {
  const decisionModelId = useDecisionModelId()
  const { data = [], isLoading, error, refetch } = useAlternatives(decisionModelId)

  if (isLoading) {
    return <LoadingState title="Loading alternatives" description="Preparing the list of candidates being evaluated." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Alternatives" />
      <PageHeader eyebrow="Alternatives" title="Keep candidate options clean, comparable, and easy to scan." description="The layout is ready for create, edit, delete, and bulk review actions around alternative candidates." />
      <SectionCard title="Alternative table" description="A compact listing suitable for higher-volume evaluation scenarios.">
        <DataTable
          columns={[
            { key: 'name', header: 'Alternative' },
            { key: 'description', header: 'Description', render: (row) => truncateText(row.description, 100) },
            { key: 'created_at', header: 'Created' },
          ]}
          rows={data}
        />
      </SectionCard>
    </div>
  )
}
