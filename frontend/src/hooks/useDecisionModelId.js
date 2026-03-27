import { useParams } from 'react-router-dom'

export function useDecisionModelId() {
  const { id } = useParams()
  return id
}
