import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultGradeRangeApi } from '../../services/api/result-grade-range.api'

const key = (decisionModelId) => ['result-grade-policies', decisionModelId]

export function useCreateResultGradeRange(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resultGradeRangeApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useUpdateResultGradeRange(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => resultGradeRangeApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useDeleteResultGradeRange(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resultGradeRangeApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}
