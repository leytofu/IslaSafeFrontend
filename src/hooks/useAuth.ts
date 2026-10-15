import { useCallback, useEffect, useRef, useState } from 'react'
import { environment } from '../config/environment'
import { apiFetch } from '../utils/api'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  contact_number: string | null
  office: string | null
  jurisdiction: string | null
  avatar_url: string | null
}

interface Session {
  token: string
  user: AuthUser
}

const STORAGE_KEY = 'islasafe.session'
const MOCK_USER: AuthUser = { id: 0, name: 'Admin MDRRMO', email: 'admin@mock.local', role: 'admin', contact_number: null, office: null, jurisdiction: null, avatar_url: null }

/**
 * The web dashboard is reserved for administrators. Residents and camp
 * managers will authenticate through the future mobile app — the backend
 * login endpoint stays open for them, but the web refuses every non-admin
 * session at the door.
 */
const ADMIN_ONLY_ERROR = 'This web portal is for MDRRMO administrators only. Resident and camp manager accounts will use the IslaSafe mobile app.'

function readStoredSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    return session.token && session.user ? session : null
  } catch {
    return null
  }
}

function readRemembered(): boolean {
  try {
    return !window.sessionStorage.getItem(STORAGE_KEY) && Boolean(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return false
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
  const remembered = useRef(readRemembered())

  const persist = useCallback((session: Session, remember = remembered.current) => {
    const storage = remember ? window.localStorage : window.sessionStorage
    storage.setItem(STORAGE_KEY, JSON.stringify(session))
    const other = remember ? window.sessionStorage : window.localStorage
    other.removeItem(STORAGE_KEY)
    remembered.current = remember
    setToken(session.token)
    setUser(session.user)
    setStatus('authenticated')
  }, [])

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    remembered.current = false
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

        // Refuse restored sessions that no longer hold the admin role
        // (e.g., a leftover session, or a role change after signing in).
        if (response.user.role !== 'admin') {
          window.localStorage.removeItem(STORAGE_KEY)
          window.sessionStorage.removeItem(STORAGE_KEY)
          setStatus('unauthenticated')
          return
        }

        setToken(session.token)
        setUser(response.user)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        window.localStorage.removeItem(STORAGE_KEY)
        window.sessionStorage.removeItem(STORAGE_KEY)
        setStatus('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string, remember = false): Promise<string | null> => {
      if (environment.features.useMockData) {
        persist({ token: 'mock-token', user: { ...MOCK_USER, email } }, remember)
        return null
      }

      try {
        const response = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
          method: 'POST',
          body: { email, password },
        })

        // Only the admin role may enter the web dashboard. Non-admin
        // accounts get a clear rejection instead of a session.
        if (response.user.role !== 'admin') {
          return ADMIN_ONLY_ERROR
        }

        persist(response, remember)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Sign in failed.'
      }
    },
    [persist],
  )

  const updateProfile = useCallback(
    async (input: { name: string; email: string; contact_number: string; office: string; jurisdiction: string; avatar?: File }): Promise<string | null> => {
      if (environment.features.useMockData) {
        // Mock mode: apply changes locally so the UI can be explored.
        const current = user ?? MOCK_USER
        persist({
          token: token ?? 'mock-token',
          user: {
            ...current,
            name: input.name,
            email: input.email,
            contact_number: input.contact_number || null,
            office: input.office || null,
            jurisdiction: input.jurisdiction || null,
          },
        })
        return null
      }

      if (!token) return 'Your session has expired. Please sign in again.'

      try {
        // Multipart payload — the avatar file (when present) rides along.
        const form = new FormData()
        form.append('name', input.name)
        form.append('email', input.email)
        form.append('contact_number', input.contact_number)
        form.append('office', input.office)
        form.append('jurisdiction', input.jurisdiction)
        if (input.avatar) form.append('avatar', input.avatar)

        const response = await apiFetch<{ message: string; user: AuthUser }>('/auth/profile', {
          method: 'PATCH',
          body: form,
          token,
        })

        // Keep the stored session in sync with the server's copy.
        persist({ token, user: response.user })
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'Failed to update profile.'
      }
    },
    [persist, token, user],
  )

  const signOut = useCallback(() => {
    const currentToken = token
    if (currentToken && !environment.features.useMockData) {
      apiFetch('/auth/logout', { method: 'POST', token: currentToken }).catch(() => undefined)
    }
    clear()
  }, [token, clear])

  return { status, user, token, signIn, signOut, updateProfile }
}
