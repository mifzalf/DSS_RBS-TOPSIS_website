export function SelectField({ options, ...props }) {
  return (
    <div className="select-field-shell">
      <select className="input select-field-input" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="select-field-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" className="select-field-icon-svg">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  )
}
