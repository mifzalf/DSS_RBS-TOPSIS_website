import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const memberApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/decision-model/${decisionModelId}/members`)),
  create: async (decisionModelId, payload) => unwrapResponse(await httpClient.post(`/decision-model/${decisionModelId}/members`, payload)),
  update: async (decisionModelId, memberId, payload) => unwrapResponse(await httpClient.patch(`/decision-model/${decisionModelId}/members/${memberId}`, payload)),
  remove: async (decisionModelId, memberId) => unwrapResponse(await httpClient.delete(`/decision-model/${decisionModelId}/members/${memberId}`)),
}
