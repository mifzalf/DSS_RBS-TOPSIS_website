import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { alternativeApi } from '../../services/api/alternative.api'

export function useAlternatives(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.alternatives(decisionModelId),
    queryFn: () => alternativeApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCreateAlternative(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alternativeApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.alternatives(decisionModelId) }),
  })
}

export function useUpdateAlternative(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => alternativeApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.alternatives(decisionModelId) }),
  })
}

export function useDeleteAlternative(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: alternativeApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.alternatives(decisionModelId) }),
  })
}
