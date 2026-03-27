import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const criteriaApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/criteria/decision-model/${decisionModelId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/criteria', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/criteria/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/criteria/${id}`)),
  listSubCriteria: async (criteriaId) => unwrapResponse(await httpClient.get(`/criteria/${criteriaId}/sub-criteria`)),
  createSubCriteria: async (criteriaId, payload) => unwrapResponse(await httpClient.post(`/criteria/${criteriaId}/sub-criteria`, payload)),
  updateSubCriteria: async (id, payload) => unwrapResponse(await httpClient.patch(`/criteria/sub-criteria/${id}`, payload)),
  removeSubCriteria: async (id) => unwrapResponse(await httpClient.delete(`/criteria/sub-criteria/${id}`)),
}
