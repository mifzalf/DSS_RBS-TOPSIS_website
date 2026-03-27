import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../../services/api/auth.api'
import { subscribeToUnauthorized } from '../../services/http/sessionEvents'
import { authStorage } from '../../services/http/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }))

  const setAuthenticatedSession = useCallback(({ token, user }) => {
    authStorage.setSession({ token, user })
    setSession({ token, user })
  }, [])

  const logout = useCallback(() => {
    authStorage.clearSession()
    setSession({ token: null, user: null })
  }, [])

  const login = useCallback(
    async (payload) => {
      const response = await authApi.login(payload)
      setAuthenticatedSession({ token: response.token, user: response.data })
      return response
    },
    [setAuthenticatedSession],
  )

  const register = useCallback(
    async (payload) => {
      const response = await authApi.register(payload)
      setAuthenticatedSession({ token: response.token, user: response.data })
      return response
    },
    [setAuthenticatedSession],
  )

  useEffect(() => subscribeToUnauthorized(logout), [logout])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session.token),
      token: session.token,
      user: session.user,
      login,
      register,
      logout,
    }),
    [login, logout, register, session.token, session.user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
