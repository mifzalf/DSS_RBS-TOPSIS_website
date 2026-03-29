import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { ruleEvaluationApi } from '../../services/api/rule-evaluation.api'

export function useRuleEvaluations(alternativeId) {
  return useQuery({
    queryKey: queryKeys.ruleEvaluations(alternativeId),
    queryFn: () => ruleEvaluationApi.listByAlternative(alternativeId),
    enabled: Boolean(alternativeId),
  })
}

export function useUpsertRuleEvaluation(alternativeId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => (id ? ruleEvaluationApi.update(id, payload) : ruleEvaluationApi.create(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ruleEvaluations(alternativeId) }),
  })
}

export function useDeleteRuleEvaluation(alternativeId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ruleEvaluationApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ruleEvaluations(alternativeId) }),
  })
}
