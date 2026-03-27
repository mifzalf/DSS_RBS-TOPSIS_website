import { useEffect, useRef, useState } from 'react'

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="action-menu-trigger-icon">
      <circle cx="10" cy="4.5" r="1.6" fill="currentColor" />
      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function ActionMenu({ items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={containerRef} className="action-menu">
      <button type="button" className="icon-button action-menu-trigger" onClick={() => setOpen((current) => !current)} aria-label="Open actions">
        <MoreIcon />
      </button>

      {open ? (
        <div className={`action-menu-popover action-menu-popover-${align}`}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`action-menu-item ${item.tone === 'danger' ? 'danger' : ''}`}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
