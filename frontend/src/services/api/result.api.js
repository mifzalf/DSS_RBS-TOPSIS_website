import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const resultApi = {
  list: async (decisionModelId) => unwrapResponse(await httpClient.get(`/results/decision-model/${decisionModelId}`)),
}
