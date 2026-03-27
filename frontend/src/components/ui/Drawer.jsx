export function Drawer({ open, title, children, onClose }) {
  if (!open) {
    return null
  }

  return (
    <div className="overlay drawer-overlay" role="presentation" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h3>{title}</h3>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close drawer">
            x
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </aside>
    </div>
  )
}
