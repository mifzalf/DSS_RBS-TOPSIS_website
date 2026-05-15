import { Badge } from '../ui/Badge'

export function ImportSummary({ summary }) {
  if (!summary) return null

  const items = [
    { label: 'Total baris', value: summary.total_rows ?? 0, tone: 'neutral' },
    { label: 'Akan dibuat', value: summary.to_create ?? 0, tone: 'success' },
    { label: 'Akan diperbarui', value: summary.to_update ?? 0, tone: 'info' },
    { label: 'Akan dilewati', value: summary.to_skip ?? 0, tone: 'warning' },
    { label: 'Bermasalah', value: summary.invalid_count ?? 0, tone: 'danger' },
  ]

  return (
    <div className="import-summary-grid">
      {items.map((item) => (
        <article key={item.label} className="import-summary-card">
          <span className="import-summary-label">{item.label}</span>
          <strong className="import-summary-value">{item.value}</strong>
          <Badge tone={item.tone}>{item.value}</Badge>
        </article>
      ))}
    </div>
  )
}
