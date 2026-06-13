import { createContext, useContext, useState, useEffect } from 'react'
import { isLoggedIn, getUserId, getMe, logout } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoggedIn()) {
      getMe()
        .then(setUser)
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const refresh = () => getMe().then(setUser)

  return (
    <AuthContext.Provider value={{ user, loading, isAuth: isLoggedIn(), logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
