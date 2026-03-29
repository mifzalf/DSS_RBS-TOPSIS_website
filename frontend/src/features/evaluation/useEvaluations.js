import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { evaluationApi } from '../../services/api/evaluation.api'

export function useCreateEvaluation(alternativeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluationApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.evaluations(alternativeId) }),
  })
}

export function useUpdateEvaluation(alternativeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => evaluationApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.evaluations(alternativeId) }),
  })
}

export function useDeleteEvaluation(alternativeId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluationApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.evaluations(alternativeId) }),
  })
}
