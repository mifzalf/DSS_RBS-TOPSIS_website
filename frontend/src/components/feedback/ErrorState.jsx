import { Button } from '../ui/Button'

export function ErrorState({ title = 'Something went wrong', description, actionLabel = 'Try again', onAction }) {
  return (
    <div className="feedback-state surface-panel error-state">
      <h3>{title}</h3>
      <p>{description || 'The request could not be completed. Review the response and retry.'}</p>
      {onAction ? (
        <Button type="button" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
