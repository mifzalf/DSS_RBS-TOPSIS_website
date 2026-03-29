import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 20 20" className={`dropdown-select-chevron${open ? ' open' : ''}`} aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DropdownSelect({ value, options, placeholder = 'Select option', onChange, disabled = false }) {
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
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    })
  }, [open])

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
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }

    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('resize', handleViewport)
    window.addEventListener('scroll', handleViewport, true)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('resize', handleViewport)
      window.removeEventListener('scroll', handleViewport, true)
    }
  }, [open])

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
