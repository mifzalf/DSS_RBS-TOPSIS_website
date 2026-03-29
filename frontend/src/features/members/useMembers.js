import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../constants/queryKeys'
import { memberApi } from '../../services/api/member.api'

export function useMembers(decisionModelId) {
  return useQuery({
    queryKey: queryKeys.members(decisionModelId),
    queryFn: () => memberApi.list(decisionModelId),
    enabled: Boolean(decisionModelId),
  })
}

export function useCreateMember(decisionModelId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => memberApi.create(decisionModelId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(decisionModelId) }),
  })
}

export function useUpdateMember(decisionModelId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, payload }) => memberApi.update(decisionModelId, memberId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(decisionModelId) }),
  })
}

export function useDeleteMember(decisionModelId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId) => memberApi.remove(decisionModelId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(decisionModelId) }),
  })
}
