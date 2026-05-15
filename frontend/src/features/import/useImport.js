import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { importApi } from '../../services/api/import.api'
import { queryKeys } from '../../constants/queryKeys'
import { IMPORT_KINDS } from './import.constants'

function triggerBrowserDownload({ blob, filename, fallbackName }) {
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || fallbackName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function buildFallbackTemplateName(decisionModelId, kind) {
  if (kind === IMPORT_KINDS.ALTERNATIVES) return `alternatives-template-dm-${decisionModelId}.xlsx`
  if (kind === IMPORT_KINDS.TOPSIS_EVALUATIONS) return `topsis-evaluations-template-dm-${decisionModelId}.xlsx`
  if (kind === IMPORT_KINDS.RULE_EVALUATIONS) return `rule-evaluations-template-dm-${decisionModelId}.xlsx`
  return `template-dm-${decisionModelId}.xlsx`
}

function getInvalidationKeysForKind(kind, decisionModelId) {
  if (kind === IMPORT_KINDS.ALTERNATIVES) {
    return [
      queryKeys.alternatives(decisionModelId),
      queryKeys.decisionModel(decisionModelId),
      queryKeys.decisionModels,
      queryKeys.results(decisionModelId),
    ]
  }

  if (kind === IMPORT_KINDS.TOPSIS_EVALUATIONS) {
    return [
      ['evaluations'],
      queryKeys.alternatives(decisionModelId),
      queryKeys.decisionModel(decisionModelId),
      queryKeys.decisionModels,
      queryKeys.results(decisionModelId),
    ]
  }

  if (kind === IMPORT_KINDS.RULE_EVALUATIONS) {
    return [
      ['rule-evaluations'],
      ['rule-evaluations-overview'],
      queryKeys.alternatives(decisionModelId),
      queryKeys.ruleVariables(decisionModelId),
      queryKeys.decisionModel(decisionModelId),
      queryKeys.decisionModels,
      queryKeys.results(decisionModelId),
    ]
  }

  return []
}

export function useDownloadImportTemplate(decisionModelId, kind) {
  return useMutation({
    mutationFn: async () => {
      const result = await importApi.downloadTemplate(decisionModelId, kind)
      triggerBrowserDownload({
        blob: result.blob,
        filename: result.filename,
        fallbackName: buildFallbackTemplateName(decisionModelId, kind),
      })
      return result
    },
  })
}

export function usePreviewImport(decisionModelId, kind) {
  return useMutation({
    mutationFn: async ({ file, mode }) => {
      const response = await importApi.preview(decisionModelId, kind, { file, mode })
      return response
    },
  })
}

export function useCommitImport(decisionModelId, kind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ previewToken, skipInvalid }) => {
      const response = await importApi.commit(decisionModelId, kind, { previewToken, skipInvalid })
      return response
    },
    onSuccess: () => {
      const keys = getInvalidationKeysForKind(kind, decisionModelId)
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export function useImportHistory(decisionModelId, { limit = 50, enabled = true } = {}) {
  return useQuery({
    queryKey: ['import-history', decisionModelId, limit],
    queryFn: () => importApi.history(decisionModelId, { limit }),
    enabled: enabled && Boolean(decisionModelId),
  })
}
