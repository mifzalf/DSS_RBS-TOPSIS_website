import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const ruleApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/rules/decision-model/${decisionModelId}`)),
  create: async (payload) => unwrapResponse(await httpClient.post('/rules', payload)),
  update: async (id, payload) => unwrapResponse(await httpClient.patch(`/rules/${id}`, payload)),
  remove: async (id) => unwrapResponse(await httpClient.delete(`/rules/${id}`)),
  listConditions: async (ruleId) => unwrapResponse(await httpClient.get(`/rules/${ruleId}/conditions`)),
  createCondition: async (payload) => unwrapResponse(await httpClient.post('/rules/conditions', payload)),
  updateCondition: async (id, payload) => unwrapResponse(await httpClient.patch(`/rules/conditions/${id}`, payload)),
  removeCondition: async (id) => unwrapResponse(await httpClient.delete(`/rules/conditions/${id}`)),
}
