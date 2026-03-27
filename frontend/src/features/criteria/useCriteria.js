import { useQueries, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { criteriaApi } from '../../services/api/criteria.api'

export function useCriteria(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.criteria(decisionModelId),
    queryFn: () => criteriaApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCriteriaWithSubCriteria(decisionModelId) {
  const criteriaQuery = useCriteria(decisionModelId)
  const criteria = criteriaQuery.data || []

  const subCriteriaQueries = useQueries({
    queries: criteria.map((item) => ({
      queryKey: ['sub-criteria', item.id],
      queryFn: () => criteriaApi.listSubCriteria(item.id),
      enabled: Boolean(item.id),
    })),
  })

  const data = criteria.map((item, index) => ({
    ...item,
    subCriteria: subCriteriaQueries[index]?.data || [],
  }))

  return {
    ...criteriaQuery,
    data,
    isLoading: criteriaQuery.isLoading || subCriteriaQueries.some((query) => query.isLoading),
  }
}
