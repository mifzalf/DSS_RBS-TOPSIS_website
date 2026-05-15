import { httpClient } from '../http/httpClient'
import { unwrapResponse } from './helpers'

const RESOURCE_PATHS = {
  alternatives: 'alternatives',
  topsis_evaluations: 'topsis-evaluations',
  rule_evaluations: 'rule-evaluations',
}

function basePath(decisionModelId, kind) {
  const segment = RESOURCE_PATHS[kind]
  if (!segment) {
    throw new Error(`Unknown import kind: ${kind}`)
  }
  return `/import/decision-model/${decisionModelId}/${segment}`
}

export const importApi = {
  downloadTemplate: (decisionModelId, kind) =>
    httpClient.download(`${basePath(decisionModelId, kind)}/template`),

  preview: (decisionModelId, kind, { file, mode }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (mode) formData.append('mode', mode)
    return httpClient.upload(`${basePath(decisionModelId, kind)}/preview`, formData)
  },

  commit: (decisionModelId, kind, { previewToken, skipInvalid = true }) =>
    httpClient.post(`${basePath(decisionModelId, kind)}/commit`, {
      preview_token: previewToken,
      skip_invalid: skipInvalid,
    }),

  history: async (decisionModelId, { limit } = {}) => {
    const params = new URLSearchParams()
    if (limit) params.set('limit', String(limit))
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return unwrapResponse(
      await httpClient.get(`/import/decision-model/${decisionModelId}/history${suffix}`),
    )
  },
}
