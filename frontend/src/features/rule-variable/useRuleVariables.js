import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { ruleVariableApi } from '../../services/api/rule-variable.api'

export function useRuleVariables(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.ruleVariables(decisionModelId),
    queryFn: () => ruleVariableApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCreateRuleVariable(decisionModelId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ruleVariableApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ruleVariables(decisionModelId) }),
  })
}

export function useUpdateRuleVariable(decisionModelId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => ruleVariableApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ruleVariables(decisionModelId) }),
  })
}

export function useDeleteRuleVariable(decisionModelId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ruleVariableApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ruleVariables(decisionModelId) }),
  })
}
