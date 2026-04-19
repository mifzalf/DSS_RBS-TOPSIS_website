import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assistanceCategoriesApi } from '../../services/api/assistance-categories.api'

const key = (decisionModelId) => ['assistance-categories', decisionModelId]

export function useAssistanceCategories(decisionModelId) {
  return useQuery({
    queryKey: key(decisionModelId),
    queryFn: () => assistanceCategoriesApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCreateAssistanceCategory(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assistanceCategoriesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useUpdateAssistanceCategory(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => assistanceCategoriesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useDeleteAssistanceCategory(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assistanceCategoriesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}
