import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gradePolicyApi } from '../../services/api/grade-policy.api'

const key = (decisionModelId) => ['result-grade-policies', decisionModelId]

export function useGradePolicies(decisionModelId) {
  return useQuery({
    queryKey: key(decisionModelId),
    queryFn: () => gradePolicyApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCreateGradePolicy(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradePolicyApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useUpdateGradePolicy(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => gradePolicyApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useDeleteGradePolicy(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradePolicyApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}
