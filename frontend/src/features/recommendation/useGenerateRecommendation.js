import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { recommendationApi } from '../../services/api/recommendation.api'

export function useGenerateRecommendation(decisionModelId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => recommendationApi.generate(decisionModelId),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.recommendation(decisionModelId), response)
      queryClient.invalidateQueries({ queryKey: queryKeys.results(decisionModelId) })
    },
  })
}
