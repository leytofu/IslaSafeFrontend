import { useCallback, useEffect, useState } from 'react'
import { environment } from '../config/environment'
import { apiFetch } from '../utils/api'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

interface Session {
  token: string
  user: AuthUser
}

const STORAGE_KEY = 'islasafe.session'
const MOCK_USER: AuthUser = { id: 0, name: 'Admin MDRRMO', email: 'admin@mock.local', role: 'admin' }

function readStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    return session.token && session.user ? session : null
  } catch {
    return null
  }
}

/**
 * Token-based authentication against the Laravel API.
 * In mock mode (`VITE_ENABLE_MOCK_DATA=true`) sign-in succeeds locally with
 * an admin user so the UI can be explored without a backend.
 */
export function useAuth() {
  // Mock mode never waits on the network; real mode starts in 'loading'
  // only when a stored session exists to restore, otherwise it is already
  // signed out (no setState needed inside the effect).
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (environment.features.useMockData) return 'unauthenticated'
    return readStoredSession() ? 'loading' : 'unauthenticated'
  })
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const persist = useCallback((session: Session) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setToken(session.token)
    setUser(session.user)
    setStatus('authenticated')
  }, [])

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    if (environment.features.useMockData) {
      return
    }

    const session = readStoredSession()
    if (!session) {
      return
    }

    let cancelled = false
    apiFetch<{ user: AuthUser }>('/auth/me', { token: session.token })
      .then((response) => {
        if (cancelled) return
        setToken(session.token)
        setUser(response.user)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        window.localStorage.removeItem(STORAGE_KEY)
        setStatus('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      if (environment.features.useMockData) {
        persist({ token: 'mock-token', user: { ...MOCK_USER, email } })
        return null
      }

      try {
        const response = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        persist(response)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Sign in failed.'
      }
    },
    [persist],
  )

  const register = useCallback(
    async (input: { name: string; email: string; password: string }): Promise<string | null> => {
      if (environment.features.useMockData) {
        persist({ token: 'mock-token', user: { ...MOCK_USER, name: input.name, email: input.email } })
        return null
      }

      try {
        const response = await apiFetch<{ token: string; user: AuthUser }>('/auth/register', {
          method: 'POST',
          body: { ...input, password_confirmation: input.password },
        })
        persist(response)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Registration failed.'
      }
    },
    [persist],
  )

  const signOut = useCallback(() => {
    const currentToken = token
    if (currentToken && !environment.features.useMockData) {
      apiFetch('/auth/logout', { method: 'POST', token: currentToken }).catch(() => undefined)
    }
    clear()
  }, [token, clear])

  return { status, user, token, signIn, register, signOut }
}
