import { Button } from '../ui/Button'

export function ErrorState({ title = 'Terjadi kendala', description, actionLabel = 'Coba lagi', onAction }) {
  return (
    <div className="feedback-state surface-panel error-state">
      <h3>{title}</h3>
      <p>{description || 'Permintaan belum dapat diproses. Silakan periksa kembali lalu coba lagi.'}</p>
      {onAction ? (
        <Button type="button" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
