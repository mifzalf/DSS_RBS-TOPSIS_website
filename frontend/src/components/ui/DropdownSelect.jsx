import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 20 20" className={`dropdown-select-chevron${open ? ' open' : ''}`} aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const computePosition = (triggerRect, popoverHeight = 320) => {
  const gap = 8
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const belowTop = triggerRect.bottom + gap
  const belowFits = belowTop + popoverHeight <= viewportHeight

  if (belowFits) {
    return {
      top: belowTop,
      left: Math.max(8, Math.min(triggerRect.left, viewportWidth - triggerRect.width - 16)),
      width: triggerRect.width,
    }
  }

  const aboveBottom = triggerRect.top - gap
  const aboveFits = aboveBottom - popoverHeight >= 0

  if (aboveFits) {
    return {
      top: Math.max(8, aboveBottom - popoverHeight),
      left: Math.max(8, Math.min(triggerRect.left, viewportWidth - triggerRect.width - 16)),
      width: triggerRect.width,
    }
  }

  return {
    top: Math.max(8, viewportHeight - popoverHeight - 8),
    left: Math.max(8, Math.min(triggerRect.left, viewportWidth - triggerRect.width - 16)),
    width: triggerRect.width,
  }
}

export function DropdownSelect({ value, options, placeholder = 'Pilih opsi', onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value],
  )

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return
    }

    const rect = triggerRef.current.getBoundingClientRect()
    const optionCount = options.length
    const estimatedPopoverHeight = Math.min(48 * optionCount + 20, 320)
    setPosition(computePosition(rect, estimatedPopoverHeight))
  }, [open, options.length])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleOutside = (event) => {
      const clickedTrigger = triggerRef.current?.contains(event.target)
      const clickedPopover = popoverRef.current?.contains(event.target)

      if (!clickedTrigger && !clickedPopover) {
        setOpen(false)
      }
    }

    const handleViewport = () => {
      if (!triggerRef.current) {
        return
      }

      const rect = triggerRef.current.getBoundingClientRect()
      const optionCount = options.length
      const estimatedPopoverHeight = Math.min(48 * optionCount + 20, 320)
      setPosition(computePosition(rect, estimatedPopoverHeight))
    }

    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('resize', handleViewport)
    window.addEventListener('scroll', handleViewport, true)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('resize', handleViewport)
      window.removeEventListener('scroll', handleViewport, true)
    }
  }, [open, options.length])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`dropdown-select-trigger${open ? ' open' : ''}`}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current)
          }
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`dropdown-select-label${selectedOption ? '' : ' placeholder'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="dropdown-select-popover"
              style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px` }}
              role="listbox"
            >
              {options.map((option) => {
                const isSelected = String(option.value) === String(value)

                return (
                  <button
                    key={`${option.value}`}
                    type="button"
                    className={`dropdown-select-option${isSelected ? ' active' : ''}`}
                    onClick={() => {
                      setOpen(false)
                      onChange(option.value)
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
