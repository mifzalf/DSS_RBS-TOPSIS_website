import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { RoleBadge } from '../../components/navigation/RoleBadge'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatCard } from '../../components/ui/StatCard'
import { ROUTES, WORKFLOW_STEPS } from '../../constants/routes'
import { useDecisionModels } from '../../features/decision-model/useDecisionModels'
import { formatDate, truncateText } from '../../utils/format'

export function DashboardPage() {
  const { data = [], isLoading, error, refetch } = useDecisionModels()
  const latestModels = data.slice(0, 3)

  if (isLoading) {
    return <LoadingState title="Loading dashboard" description="Collecting decision model statistics and recent activity." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dashboard"
        title="Track the full DSS workflow without losing the next step."
        description="This shell keeps model status, team access, and recommendation readiness visible from one overview."
        actions={<Link className="button button-primary" to={ROUTES.decisionModels}>Open models</Link>}
      />

      <div className="dashboard-layout-grid">
        <div className="dashboard-main-stack">
          <section className="dashboard-metrics-grid">
            <StatCard label="Decision models" value={data.length} hint="Active models linked to your current membership." />
            <StatCard label="Workflow steps" value={WORKFLOW_STEPS.length} hint="A shared sequence from setup to recommendation." tone="accent" />
          </section>

          <SectionCard title="Recent models" description="Quick return point for the latest decision spaces.">
            {latestModels.length ? (
              <DataTable
                columns={[
                  { key: 'name', header: 'Model' },
                  { key: 'descriptions', header: 'Description', render: (row) => truncateText(row.descriptions, 72) },
                  { key: 'role', header: 'Role', render: (row) => <RoleBadge role={row.role} /> },
                  { key: 'created_at', header: 'Created', render: (row) => formatDate(row.created_at) },
                ]}
                rows={latestModels}
              />
            ) : (
              <EmptyState title="No decision model yet" description="Create the first model so the rest of the DSS workflow can be activated." actionLabel="Create model" onAction={() => {}} />
            )}
          </SectionCard>
        </div>

        <div className="dashboard-side-stack">
          <SectionCard title="Recommended workflow" description="Keep the team aligned on what should happen next." className="dashboard-workflow-card">
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
