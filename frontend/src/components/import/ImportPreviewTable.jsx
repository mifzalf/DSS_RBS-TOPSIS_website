import { useMemo, useState } from 'react'
import { Badge } from '../ui/Badge'
import { IMPORT_KINDS } from '../../features/import/import.constants'

const STATUS_TONES = {
  valid: 'success',
  conflict: 'info',
  invalid: 'danger',
  noop: 'neutral',
}

const STATUS_LABELS = {
  valid: 'Akan dibuat',
  conflict: 'Akan diperbarui',
  invalid: 'Bermasalah',
  noop: 'Tidak ada perubahan',
}

const ACTION_LABELS = {
  create: 'Buat',
  update: 'Perbarui',
  skip: 'Lewati',
  set: 'Simpan',
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'valid', label: 'Akan dibuat' },
  { value: 'conflict', label: 'Akan diperbarui' },
  { value: 'invalid', label: 'Bermasalah' },
]

function summarizeCellAction(cells = []) {
  const counts = cells.reduce(
    (acc, cell) => {
      const action = cell.final_action || cell.action
      if (action === 'create') acc.create += 1
      else if (action === 'update') acc.update += 1
      else acc.skip += 1
      return acc
    },
    { create: 0, update: 0, skip: 0 },
  )
  const parts = []
  if (counts.create) parts.push(`+${counts.create} baru`)
  if (counts.update) parts.push(`~${counts.update} update`)
  if (counts.skip) parts.push(`${counts.skip} dilewati`)
  return parts.join(' · ') || 'Tidak ada perubahan'
}

function buildCellPreview(cells = []) {
  return cells
    .filter((cell) => cell.final_action !== 'skip' || cell.errors?.length)
    .slice(0, 6)
    .map((cell) => {
      const value = cell.sub_criteria_label || cell.payload?.value_string || cell.payload?.value_number || (cell.payload?.value_boolean !== null && cell.payload?.value_boolean !== undefined ? String(cell.payload.value_boolean) : '')
      return `${cell.header}: ${value || '—'}`
    })
    .join(' · ')
}

export function ImportPreviewTable({ kind, rows = [] }) {
  const [filter, setFilter] = useState('all')

  const visibleRows = useMemo(() => {
    if (filter === 'all') return rows
    return rows.filter((row) => row.status === filter)
  }, [filter, rows])

  if (!rows.length) {
    return <div className="empty-state subtle-text">Tidak ada baris terdeteksi pada file.</div>
  }

  return (
    <div className="stack-md">
      <div className="import-filter-bar">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`chip ${filter === option.value ? 'chip-active' : ''}`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
        <span className="subtle-text import-filter-count">{visibleRows.length} dari {rows.length} baris</span>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>Baris</th>
              <th>Detail</th>
              <th>Aksi</th>
              <th>Status</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const detail = kind === IMPORT_KINDS.ALTERNATIVES
                ? row.data?.name || '(kosong)'
                : `${row.data?.alternative_name || '(kosong)'}`
              const subDetail = kind === IMPORT_KINDS.ALTERNATIVES
                ? row.data?.description || ''
                : buildCellPreview(row.data?.cells || [])
              const actionLabel = kind === IMPORT_KINDS.ALTERNATIVES
                ? ACTION_LABELS[row.action] || row.action
                : summarizeCellAction(row.data?.cells || [])

              return (
                <tr key={row.row_number}>
                  <td>{row.row_number}</td>
                  <td>
                    <div className="import-row-detail">
                      <strong>{detail}</strong>
                      {subDetail ? <small className="subtle-text">{subDetail}</small> : null}
                    </div>
                  </td>
                  <td>{actionLabel}</td>
                  <td>
                    <Badge tone={STATUS_TONES[row.status] || 'neutral'}>{STATUS_LABELS[row.status] || row.status}</Badge>
                  </td>
                  <td>
                    {row.errors?.length ? (
                      <ul className="import-error-list">
                        {row.errors.map((error, index) => (
                          <li key={`${row.row_number}-${index}`}>{error.message}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="subtle-text">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
