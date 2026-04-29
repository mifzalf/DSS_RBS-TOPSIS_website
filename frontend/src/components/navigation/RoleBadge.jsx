import { Badge } from '../ui/Badge'

const toneMap = {
  owner: 'success',
  editor: 'info',
  viewer: 'neutral',
}

export function RoleBadge({ role = 'viewer' }) {
  const labelMap = {
    owner: 'Pemilik',
    editor: 'Editor',
    viewer: 'Peninjau',
  }

  return <Badge tone={toneMap[role] || 'neutral'}>{labelMap[role] || role}</Badge>
}
