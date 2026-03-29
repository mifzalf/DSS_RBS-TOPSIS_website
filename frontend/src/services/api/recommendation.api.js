import { httpClient } from '../http/httpClient'

export const recommendationApi = {
  generate: async (decisionModelId) => httpClient.post(`/recommendations/decision-model/${decisionModelId}`),
}
