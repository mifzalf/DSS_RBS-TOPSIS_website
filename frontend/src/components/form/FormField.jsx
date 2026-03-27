export function FormField({ label, hint, error, children }) {
  return (
    <label className="form-field">
      <div className="form-field-header">
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </div>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}
