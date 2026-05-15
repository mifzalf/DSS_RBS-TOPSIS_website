import { useCallback, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

const ACCEPT_EXTENSIONS = ['.xlsx']
const ACCEPT_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function isAcceptableFile(file) {
  if (!file) return false
  const lowerName = file.name.toLowerCase()
  if (!ACCEPT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) return false
  return true
}

export function ImportDropzone({ value, onChange, disabled, hint, maxFileSizeMb = 5 }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = useCallback(
    (files) => {
      setError(null)
      const file = files?.[0]
      if (!file) return
      if (!isAcceptableFile(file)) {
        setError('Hanya file .xlsx yang diizinkan.')
        return
      }
      const limitBytes = maxFileSizeMb * 1024 * 1024
      if (file.size > limitBytes) {
        setError(`Ukuran file melebihi ${maxFileSizeMb} MB.`)
        return
      }
      onChange?.(file)
    },
    [maxFileSizeMb, onChange],
  )

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    if (disabled) return
    handleFiles(event.dataTransfer?.files)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleClear = (event) => {
    event.stopPropagation()
    if (disabled) return
    setError(null)
    onChange?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="stack-sm">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={cn(
          'import-dropzone',
          dragOver && 'is-active',
          disabled && 'is-disabled',
          value && 'has-file',
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value ? (
          <div className="import-dropzone-file">
            <strong>{value.name}</strong>
            <span>{Math.max(1, Math.round(value.size / 1024))} KB</span>
            <button type="button" className="link-button" onClick={handleClear} disabled={disabled}>
              Ganti file
            </button>
          </div>
        ) : (
          <div className="import-dropzone-placeholder">
            <strong>Tarik file ke sini atau klik untuk memilih</strong>
            <span>{hint || `Format .xlsx · Maks ${maxFileSizeMb} MB`}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MIME + ',' + ACCEPT_EXTENSIONS.join(',')}
          className="visually-hidden"
          onChange={(event) => handleFiles(event.target.files)}
          disabled={disabled}
        />
      </div>
      {error ? <div className="form-error">{error}</div> : null}
    </div>
  )
}
