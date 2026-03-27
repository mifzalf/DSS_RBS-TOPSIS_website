import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { alternativeApi } from '../../services/api/alternative.api'

export function useAlternatives(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.alternatives(decisionModelId),
    queryFn: () => alternativeApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}
