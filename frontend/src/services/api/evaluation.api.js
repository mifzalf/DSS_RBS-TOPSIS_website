import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const evaluationApi = {
  listByAlternative: async (alternativeId) => unwrapResponse(await httpClient.get(`/evaluations/alternative/${alternativeId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/evaluations', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/evaluations/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/evaluations/${id}`)),
}
