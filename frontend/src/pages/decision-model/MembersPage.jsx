import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { DataTable } from '../../components/data-display/DataTable'
import { DecisionModelPageNav } from '../../components/navigation/DecisionModelPageNav'
import { RoleBadge } from '../../components/navigation/RoleBadge'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { useMembers } from '../../features/members/useMembers'
import { useDecisionModelId } from '../../hooks/useDecisionModelId'

export function MembersPage() {
  const decisionModelId = useDecisionModelId()
  const { data = [], isLoading, error, refetch } = useMembers(decisionModelId)

  if (isLoading) {
    return <LoadingState title="Loading members" description="Reading who can own, edit, or view this model." />
  }

  if (error) {
    return <ErrorState description={error.message} onAction={refetch} />
  }

  return (
    <div className="page-stack">
      <DecisionModelPageNav currentLabel="Members" />
      <PageHeader eyebrow="Members" title="Keep access explicit and role changes easy to review." description="This page is ready for add member, role mutation, and owner-protection warning flows." />
      <SectionCard title="Current members" description="Owner, editor, and viewer badges make authorization visible before a change is made.">
        <DataTable
          columns={[
            { key: 'user_id', header: 'User ID' },
            { key: 'role', header: 'Role', render: (row) => <RoleBadge role={row.role} /> },
            { key: 'created_at', header: 'Joined' },
          ]}
          rows={data}
        />
      </SectionCard>
    </div>
  )
}
