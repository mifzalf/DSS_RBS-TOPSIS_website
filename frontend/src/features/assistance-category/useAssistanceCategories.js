import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assistanceCategoryApi } from '../../services/api/assistance-category.api'

const key = (decisionModelId) => ['assistance-categories', decisionModelId]

export function useAssistanceCategories(decisionModelId) {
  return useQuery({
    queryKey: key(decisionModelId),
    queryFn: () => assistanceCategoryApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCreateAssistanceCategory(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assistanceCategoryApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useUpdateAssistanceCategory(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => assistanceCategoryApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}

export function useDeleteAssistanceCategory(decisionModelId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assistanceCategoryApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(decisionModelId) }),
  })
}
