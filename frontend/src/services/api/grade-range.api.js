import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const gradeRangeApi = {
  listByPolicy: async (policyId) => unwrapResponse(await httpClient.get(`/result-grade-ranges/policy/${policyId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/result-grade-ranges', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/result-grade-ranges/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/result-grade-ranges/${id}`)),
}
