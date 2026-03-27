import { cn } from '../../utils/cn'

export function ProgressIndicator({ value, label, hint, tone = 'default' }) {
  const normalized = Math.max(0, Math.min(100, value))

  return (
    <div className="progress-indicator">
      <div className="progress-indicator-meta">
        <span>{label}</span>
        <strong>{normalized}%</strong>
      </div>
      <div className="progress-track">
        <div className={cn('progress-fill', `progress-fill-${tone}`)} style={{ width: `${normalized}%` }} />
      </div>
      {hint ? <p className="progress-hint">{hint}</p> : null}
    </div>
  )
}
