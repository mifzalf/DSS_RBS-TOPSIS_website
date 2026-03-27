import { Badge } from '../ui/Badge'

const toneMap = {
  ready: 'success',
  warning: 'warning',
  pending: 'neutral',
  active: 'success',
  inactive: 'neutral',
}

export function StatusBadge({ status }) {
  return <Badge tone={toneMap[status] || 'neutral'}>{status}</Badge>
}
