import { useQueries, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { ruleApi } from '../../services/api/rule.api'

export function useRules(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.rules(decisionModelId),
    queryFn: () => ruleApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useRulesWithConditions(decisionModelId) {
  const rulesQuery = useRules(decisionModelId)
  const rules = rulesQuery.data || []

  const conditionsQueries = useQueries({
    queries: rules.map((rule) => ({
      queryKey: queryKeys.ruleConditions(rule.id),
      queryFn: () => ruleApi.listConditions(rule.id),
      enabled: Boolean(rule.id),
    })),
  })

  return {
    ...rulesQuery,
    data: rules.map((rule, index) => ({
      ...rule,
      conditions: conditionsQueries[index]?.data || [],
    })),
    isLoading: rulesQuery.isLoading || conditionsQueries.some((query) => query.isLoading),
  }
}
