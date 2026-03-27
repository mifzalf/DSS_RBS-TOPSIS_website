import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const recommendationApi = {
  generate: async (decisionModelId) => unwrapResponse(await httpClient.post(`/recommendations/decision-model/${decisionModelId}`)),
}
