import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useCreateCriteria(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criteriaApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.criteria(decisionModelId) }),
  })
}

export function useUpdateCriteria(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => criteriaApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.criteria(decisionModelId) }),
  })
}

export function useDeleteCriteria(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criteriaApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.criteria(decisionModelId) }),
  })
}

export function useCreateSubCriteria(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ criteriaId, payload }) => criteriaApi.createSubCriteria(criteriaId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.criteria(decisionModelId) }),
  })
}

export function useUpdateSubCriteria(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => criteriaApi.updateSubCriteria(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.criteria(decisionModelId) }),
  })
}

export function useDeleteSubCriteria(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criteriaApi.removeSubCriteria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.criteria(decisionModelId) }),
  })
}
