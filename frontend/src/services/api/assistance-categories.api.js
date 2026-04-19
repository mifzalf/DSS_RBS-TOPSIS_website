import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const assistanceCategoriesApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/assistance-categories/decision-model/${decisionModelId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/assistance-categories', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/assistance-categories/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/assistance-categories/${id}`)),
}
