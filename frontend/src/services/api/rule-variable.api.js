import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const ruleVariableApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/rule-variables/decision-model/${decisionModelId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/rule-variables', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/rule-variables/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/rule-variables/${id}`)),
}
