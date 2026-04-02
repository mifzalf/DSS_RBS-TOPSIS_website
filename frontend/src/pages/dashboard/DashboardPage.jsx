import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { RoleBadge } from '../../components/navigation/RoleBadge'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { WORKFLOW_STEPS } from '../../constants/workflow'
import { useDecisionModels } from '../../features/decision-model/useDecisionModels'
import { formatDate, truncateText } from '../../utils/format'

export function DashboardPage() {
  const { data = [], isLoading, error, refetch } = useDecisionModels()
  const latestModels = data.slice(0, 3)

  if (isLoading) {
    return <LoadingState title="Preparing your home view" description="Gathering the latest program updates and review progress." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Home"
        title="See the full assistance review journey from one place."
        description="Keep track of active programs, team access, and recommendation progress without jumping between pages." 
      />

      <div className="dashboard-layout-grid">
        <div className="dashboard-main-stack">
          <section className="dashboard-metrics-grid">
            <StatCard label="Active programs" value={data.length} hint="Programs currently available in your account." />
            <StatCard label="Review stages" value={WORKFLOW_STEPS.length} hint="A clear path from setup to final recommendation." tone="accent" />
          </section>

          <SectionCard title="Recent programs" description="Return quickly to the assistance programs you worked on most recently.">
            {latestModels.length ? (
              <DataTable
                columns={[
                  { key: 'name', header: 'Program' },
                  { key: 'descriptions', header: 'Description', render: (row) => truncateText(row.descriptions, 72) },
                  { key: 'role', header: 'Role', render: (row) => <RoleBadge role={row.role} /> },
                  { key: 'created_at', header: 'Created', render: (row) => formatDate(row.created_at) },
                ]}
                rows={latestModels}
              />
            ) : (
              <EmptyState title="No program yet" description="Create the first assistance program to begin reviewing households and recommendations." actionLabel="Create program" onAction={() => {}} />
            )}
          </SectionCard>
        </div>

        <div className="dashboard-side-stack">
          <SectionCard title="Suggested journey" description="Follow these steps to keep every program review orderly and easy to follow." className="dashboard-workflow-card">
            <div className="workflow-list">
              {WORKFLOW_STEPS.map((step, index) => (
                <article key={step.key} className="workflow-item">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
