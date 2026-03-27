import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { resultApi } from '../../services/api/result.api'

export function useResults(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.results(decisionModelId),
    queryFn: () => resultApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}
