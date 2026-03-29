import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const userApi = {
  search: async ({ query, decisionModelId }) => unwrapResponse(await httpClient.get(`/users/search?q=${encodeURIComponent(query)}&decisionModelId=${decisionModelId}`)),
}
