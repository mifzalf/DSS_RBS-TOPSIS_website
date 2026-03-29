import { useQuery } from '@tanstack/react-query'
import { userApi } from '../../services/api/user.api'

export function useUserSearch({ query, decisionModelId, enabled = true }) {
  return useQuery({
    queryKey: ['user-search', decisionModelId, query],
    queryFn: () => userApi.search({ query, decisionModelId }),
    enabled: enabled && Boolean(query?.trim()),
    staleTime: 30_000,
  })
}
