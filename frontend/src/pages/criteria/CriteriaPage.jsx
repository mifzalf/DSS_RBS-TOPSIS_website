import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { StatusBadge } from '../../components/navigation/StatusBadge'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressIndicator } from '../../components/ui/ProgressIndicator'
import { SectionCard } from '../../components/ui/SectionCard'
import { useCriteriaWithSubCriteria } from '../../features/criteria/useCriteria'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'
import { formatDecimal, formatPercent } from '../../utils/format'

export function CriteriaPage() {
  const decisionModelId = useDecisionModelId()
  const { data = [], isLoading, error, refetch } = useCriteriaWithSubCriteria(decisionModelId)

  if (isLoading) {
    return <LoadingState title="Loading criteria" description="Checking weighted criteria and nested sub-criteria for this model." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  const totalWeight = data.reduce((sum, item) => sum + Number(item.weight || 0), 0)

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Criteria" />
      <PageHeader eyebrow="Criteria" title="Manage weighted criteria with visible balance control." description="The page focuses on total weight, criteria type, active status, and nested sub-criteria readiness." />
      <div className="content-grid two-column">
        <SectionCard title="Criteria table" description="Designed for scanability before editing or adding nested sub-criteria.">
          <DataTable
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'type', header: 'Type' },
              { key: 'weight', header: 'Weight', render: (row) => formatDecimal(row.weight) },
              { key: 'status_active', header: 'Status', render: (row) => <StatusBadge status={row.status_active ? 'active' : 'inactive'} /> },
              { key: 'subCriteria', header: 'Sub-criteria', render: (row) => row.subCriteria.length },
            ]}
            rows={data}
          />
        </SectionCard>
        <SectionCard title="Weight monitor" description="Frontend validation can use this foundation to warn before submit.">
          <div className="stack-lg">
            <ProgressIndicator value={Math.min(100, Math.round(totalWeight * 100))} label="Total weight" hint={totalWeight === 1 ? 'Weight total is ideal.' : `Current total is ${formatPercent(totalWeight)} and should reach 100%.`} tone={totalWeight === 1 ? 'success' : 'warning'} />
            <div className="stack-sm">
              {data.map((item) => (
                <article key={item.id} className="mini-card">
                  <strong>{item.name}</strong>
                  <p>
                    {item.type} - {formatPercent(item.weight)} - {item.subCriteria.length} sub-criteria
                  </p>
                </article>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
