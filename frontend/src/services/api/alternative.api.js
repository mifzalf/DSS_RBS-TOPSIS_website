import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const alternativeApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/alternatives/decision-model/${decisionModelId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/alternatives', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/alternatives/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/alternatives/${id}`)),
}
