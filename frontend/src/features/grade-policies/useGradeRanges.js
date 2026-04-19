import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gradeRangeApi } from '../../services/api/grade-range.api'

const key = (decisionModelId) => ['result-grade-policies', decisionModelId]

export function useCreateGradeRange(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradeRangeApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useUpdateGradeRange(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => gradeRangeApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useDeleteGradeRange(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradeRangeApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}
