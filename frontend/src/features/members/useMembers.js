import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { memberApi } from '../../services/api/member.api'

export function useMembers(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.members(decisionModelId),
    queryFn: () => memberApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}
