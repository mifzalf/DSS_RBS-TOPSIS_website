import { useQueries, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { ruleApi } from '../../services/api/rule.api'
import { ruleVariableApi } from '../../services/api/rule-variable.api'

export function useRules(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.rules(decisionModelId),
    queryFn: () => ruleApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useRulesWithConditions(decisionModelId) {
  const rulesQuery = useRules(decisionModelId)
  const variablesQuery = useQuery({
    queryKey: queryKeys.ruleVariables(decisionModelId),
    queryFn: () => ruleVariableApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
  const rules = rulesQuery.data || []
  const variablesById = new Map((variablesQuery.data || []).map((item) => [item.id, item]))

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
      conditions: (conditionsQueries[index]?.data || []).map((condition) => ({
        ...condition,
        ruleVariable: condition.rule_variable_id ? variablesById.get(condition.rule_variable_id) || null : null,
      })),
    })),
    isLoading: rulesQuery.isLoading || variablesQuery.isLoading || conditionsQueries.some((query) => query.isLoading),
  }
}
