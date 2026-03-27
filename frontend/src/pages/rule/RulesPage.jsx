import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useRulesWithConditions } from '../../features/rule/useRules'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

export function RulesPage() {
  const decisionModelId = useDecisionModelId()
  const { data = [], isLoading, error, refetch } = useRulesWithConditions(decisionModelId)

  if (isLoading) {
    return <LoadingState title="Loading rules" description="Preparing priority, logic type, and nested conditions." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Rules" />
      <PageHeader eyebrow="Rules" title="Expose rule priority and AND/OR logic before recommendation is generated." description="The page groups rule records with nested conditions so business logic does not disappear behind generic forms." />
      <SectionCard title="Rule list" description="Condition count stays visible to help users compare simple and complex rules.">
        <DataTable
          columns={[
            { key: 'priority', header: 'Priority' },
            { key: 'logic_type', header: 'Logic' },
            { key: 'target_category', header: 'Target category' },
            { key: 'status_active', header: 'Active', render: (row) => (row.status_active ? 'Yes' : 'No') },
            { key: 'conditions', header: 'Conditions', render: (row) => row.conditions.length },
          ]}
          rows={data}
        />
      </SectionCard>
    </div>
  )
}
