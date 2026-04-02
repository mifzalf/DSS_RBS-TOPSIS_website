import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resultGradePolicyApi } from '../../services/api/result-grade-policy.api'

const key = (decisionModelId) => ['result-grade-policies', decisionModelId]

export function useResultGradePolicies(decisionModelId) {
  return useQuery({
    queryKey: key(decisionModelId),
    queryFn: () => resultGradePolicyApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCreateResultGradePolicy(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resultGradePolicyApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useUpdateResultGradePolicy(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => resultGradePolicyApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useDeleteResultGradePolicy(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resultGradePolicyApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}
