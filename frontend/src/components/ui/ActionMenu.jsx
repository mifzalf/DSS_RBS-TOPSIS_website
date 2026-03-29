import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return
    }

    const rect = triggerRef.current.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = align === 'left' ? rect.left : rect.right

    setPosition({ top, left })
  }, [align, open])

  useEffect(() => {
    function handleOutside(event) {
      const clickedTrigger = containerRef.current?.contains(event.target)
      const clickedPopover = popoverRef.current?.contains(event.target)

      if (!clickedTrigger && !clickedPopover) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    const handleViewport = () => {
      if (open && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({ top: rect.bottom + 8, left: align === 'left' ? rect.left : rect.right })
      }
    }

    window.addEventListener('resize', handleViewport)
    window.addEventListener('scroll', handleViewport, true)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('resize', handleViewport)
      window.removeEventListener('scroll', handleViewport, true)
    }
  }, [align, open])

  return (
    <div ref={containerRef} className="action-menu">
      <button ref={triggerRef} type="button" className="icon-button action-menu-trigger" onClick={() => setOpen((current) => !current)} aria-label="Open actions">
        <MoreIcon />
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className={`action-menu-popover action-menu-popover-${align}`}
              style={{ top: `${position.top}px`, left: `${position.left}px` }}
            >
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
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
