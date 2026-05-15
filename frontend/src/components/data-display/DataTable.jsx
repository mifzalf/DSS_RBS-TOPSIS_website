import { cn } from '../../utils/cn'

export function DataTable({ columns, rows, emptyMessage = 'Belum ada data.', getRowClassName }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn(column.align === 'right' && 'align-right')}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className={getRowClassName ? getRowClassName(row) : undefined}>
                {columns.map((column) => (
                  <td key={column.key} className={cn(column.align === 'right' && 'align-right')}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
