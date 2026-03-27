export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header surface-panel">
      <div>
        {eyebrow ? <span className="page-header-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  )
}
