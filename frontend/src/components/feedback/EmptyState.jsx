import { Button } from '../ui/Button'

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="feedback-state surface-panel empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
