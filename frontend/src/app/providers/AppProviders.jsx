import { AuthProvider } from './AuthProvider'
import { FeedbackProvider } from './FeedbackProvider'
import { QueryProvider } from './QueryProvider'

export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
