import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

export const authApi = {
  login: async (payload) => httpClient.post('/auth/login', payload),
  register: async (payload) => httpClient.post('/auth/register', payload),
  getCurrentUser: async () => unwrapResponse(await httpClient.get('/health')),
}
