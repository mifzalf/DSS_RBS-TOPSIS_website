export function LoadingState({ title = 'Memuat data', description = 'Menyiapkan workspace keputusan terbaru.' }) {
  return (
    <div className="feedback-state surface-panel">
      <div className="loading-orb" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
