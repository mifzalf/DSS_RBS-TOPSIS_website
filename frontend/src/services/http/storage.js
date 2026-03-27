const TOKEN_KEY = 'dss.auth.token'
const USER_KEY = 'dss.auth.user'

export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setSession({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  getUser() {
    const value = localStorage.getItem(USER_KEY)

    if (!value) {
      return null
    }

    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  },
}
