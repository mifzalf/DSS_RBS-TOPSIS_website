export function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatPercent(value) {
  const number = Number(value || 0)

  return `${Math.round(number * 100)}%`
}

export function formatDecimal(value, maximumFractionDigits = 3) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(number)
}

export function truncateText(value, max = 120) {
  if (!value) {
    return '-'
  }

  return value.length > max ? `${value.slice(0, max - 1)}...` : value
}
