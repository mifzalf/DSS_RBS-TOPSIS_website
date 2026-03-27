import { Badge } from '../ui/Badge'

const toneMap = {
  owner: 'success',
  editor: 'info',
  viewer: 'neutral',
}

export function RoleBadge({ role = 'viewer' }) {
  return <Badge tone={toneMap[role] || 'neutral'}>{role}</Badge>
}
