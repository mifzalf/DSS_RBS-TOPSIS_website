import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { evaluationApi } from '../../services/api/evaluation.api'

export function useEvaluationOverview(alternatives = [], criteria = []) {
  const evaluationQueries = useQueries({
    queries: alternatives.map((alternative) => ({
      queryKey: ['evaluations', alternative.id],
      queryFn: () => evaluationApi.listByAlternative(alternative.id),
      enabled: Boolean(alternative.id),
    })),
  })

  const matrixRows = useMemo(
    () =>
      alternatives.map((alternative, index) => {
        const evaluations = evaluationQueries[index]?.data || []

        return {
          ...alternative,
          evaluations,
          completed: evaluations.length,
          expected: criteria.length,
        }
      }),
    [alternatives, criteria.length, evaluationQueries],
  )

  return {
    data: matrixRows,
    isLoading: evaluationQueries.some((query) => query.isLoading),
  }
}
