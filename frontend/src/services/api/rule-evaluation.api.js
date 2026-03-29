import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const ruleEvaluationApi = {
  listByAlternative: async (alternativeId) => unwrapResponse(await httpClient.get(`/rule-evaluations/alternative/${alternativeId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/rule-evaluations', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/rule-evaluations/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/rule-evaluations/${id}`)),
}
