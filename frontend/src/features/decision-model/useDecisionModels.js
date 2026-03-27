import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { decisionModelApi } from '../../services/api/decision-model.api'

export function useDecisionModels() {
  return useQuery({
    queryKey: queryKeys.decisionModels,
    queryFn: decisionModelApi.list,
  })
}

export function useDecisionModel(id) {
  return useQuery({
    queryKey: queryKeys.decisionModel(id),
    queryFn: () => decisionModelApi.detail(id),
    enabled: Boolean(id),
  })
}

export function useCreateDecisionModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: decisionModelApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.decisionModels })
    },
  })
}

export function useUpdateDecisionModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => decisionModelApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.decisionModels })
      queryClient.invalidateQueries({ queryKey: queryKeys.decisionModel(variables.id) })
    },
  })
}

export function useDeleteDecisionModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => decisionModelApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.decisionModels })
      queryClient.removeQueries({ queryKey: queryKeys.decisionModel(id) })
    },
  })
}
