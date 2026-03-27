import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const decisionModelApi = {
  list: async () => unwrapResponse(await httpClient.get('/decision-model')),
  detail: async (id) => unwrapResponse(await httpClient.get(`/decision-model/${id}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/decision-model', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/decision-model/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/decision-model/${id}`)),
}
