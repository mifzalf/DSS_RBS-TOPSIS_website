import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const gradePolicyApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/result-grade-policies/decision-model/${decisionModelId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/result-grade-policies', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/result-grade-policies/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/result-grade-policies/${id}`)),
}
