import { createContext, useCallback, useMemo, useState } from 'react'
import { ToastViewport } from '../../components/feedback/ToastViewport'

const FeedbackContext = createContext(null)

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ title, description, tone = 'info' }) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, title, description, tone }])
      window.setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast],
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </FeedbackContext.Provider>
  )
}

export { FeedbackContext }
