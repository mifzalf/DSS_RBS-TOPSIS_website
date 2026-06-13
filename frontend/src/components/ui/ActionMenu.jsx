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

const ITEM_HEIGHT = 38
const POPOVER_PADDING = 12
const POPOVER_GAP = 8

function computeActionMenuPosition(triggerRect, itemCount, align) {
  const viewportHeight = window.innerHeight
  const estimatedHeight = itemCount * ITEM_HEIGHT + POPOVER_PADDING

  const belowTop = triggerRect.bottom + POPOVER_GAP
  const belowFits = belowTop + estimatedHeight <= viewportHeight

  const left = align === 'left' ? triggerRect.left : triggerRect.right

  if (belowFits) {
    return { top: belowTop, left, placement: 'bottom' }
  }

  const aboveTop = triggerRect.top - POPOVER_GAP - estimatedHeight
  const aboveFits = aboveTop >= 0

  if (aboveFits) {
    return { top: triggerRect.top - POPOVER_GAP, left, placement: 'top' }
  }

  // Fallback: clamp ke dalam viewport supaya tidak terpotong
  const clampedTop = Math.max(8, viewportHeight - estimatedHeight - 8)
  return { top: clampedTop, left, placement: 'bottom' }
}

export function ActionMenu({ items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' })

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return
    }

    const rect = triggerRef.current.getBoundingClientRect()
    setPosition(computeActionMenuPosition(rect, items.length, align))
  }, [align, open, items.length])

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
        setPosition(computeActionMenuPosition(rect, items.length, align))
      }
    }

    window.addEventListener('resize', handleViewport)
    window.addEventListener('scroll', handleViewport, true)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('resize', handleViewport)
      window.removeEventListener('scroll', handleViewport, true)
    }
  }, [align, open, items.length])

  return (
    <div ref={containerRef} className="action-menu">
      <button ref={triggerRef} type="button" className="icon-button action-menu-trigger" onClick={() => setOpen((current) => !current)} aria-label="Buka aksi">
        <MoreIcon />
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className={`action-menu-popover action-menu-popover-${align} action-menu-popover-${position.placement}`}
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
