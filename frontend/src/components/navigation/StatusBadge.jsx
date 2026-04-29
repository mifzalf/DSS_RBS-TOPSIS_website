import { Badge } from '../ui/Badge'

const toneMap = {
  ready: 'success',
  warning: 'warning',
  pending: 'neutral',
  active: 'success',
  inactive: 'neutral',
}

export function StatusBadge({ status }) {
  const labelMap = {
    ready: 'Siap',
    warning: 'Perlu perhatian',
    pending: 'Menunggu',
    active: 'Aktif',
    inactive: 'Nonaktif',
  }

  return <Badge tone={toneMap[status] || 'neutral'}>{labelMap[status] || status}</Badge>
}
