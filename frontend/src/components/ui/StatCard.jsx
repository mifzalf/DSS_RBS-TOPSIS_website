import { cn } from '../../utils/cn'

export function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <article className={cn('stat-card', `stat-card-${tone}`)}>
      <span className="stat-card-label">{label}</span>
      <strong className="stat-card-value">{value}</strong>
      {hint ? <span className="stat-card-hint">{hint}</span> : null}
    </article>
  )
}
