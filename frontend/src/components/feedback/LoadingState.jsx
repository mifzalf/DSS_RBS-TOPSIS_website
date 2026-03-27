export function LoadingState({ title = 'Loading data', description = 'Preparing the latest decision workspace.' }) {
  return (
    <div className="feedback-state surface-panel">
      <div className="loading-orb" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
