import { useCallback, useEffect, useRef, useState } from 'react'
import { environment } from '../config/environment'
import { ApiError, apiFetch, initializeCsrf } from '../utils/api'

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

const MOCK_USER: AuthUser = { id: 0, name: 'Admin MDRRMO', email: 'admin@mock.local', role: 'admin', contact_number: null, office: null, jurisdiction: null, avatar_url: null }
const ADMIN_ONLY_ERROR = 'This web portal is for MDRRMO administrators only. Resident and camp manager accounts use the IslaSafe mobile app.'

/** Browser authentication lives exclusively in Laravel's HttpOnly session cookie. */
export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>(environment.features.useMockData ? 'unauthenticated' : 'loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  // An in-memory generation key invalidates requests after an account switch.
  // It is not a credential and is never sent to the server or persisted.
  const [sessionKey, setSessionKey] = useState<string | null>(null)
  const currentSession = useRef<string | null>(null)
  const generation = useRef(0)

  const clear = useCallback(() => {
    currentSession.current = null
    setSessionKey(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const accept = useCallback((account: AuthUser) => {
    currentSession.current = `${account.id}:${++generation.current}`
    setUser(account)
    setSessionKey(currentSession.current)
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    // Discard credentials saved by the previous bearer-token implementation.
    for (const name of ['localStorage', 'sessionStorage'] as const) {
      try { window[name].removeItem('islasafe.session') } catch { /* Cookie sessions do not require storage access. */ }
    }
    if (environment.features.useMockData) return
    let cancelled = false
    const expired = (event: Event) => {
      const requestSession = (event as CustomEvent<string | undefined>).detail
      if (!requestSession || requestSession === currentSession.current) clear()
    }
    window.addEventListener('islasafe:unauthenticated', expired)
    apiFetch<{ user: AuthUser }>('/auth/me')
      .then(({ user: account }) => {
        if (cancelled) return
        if (account.role !== 'admin') { clear(); return }
        accept(account)
      })
      .catch(() => { if (!cancelled) clear() })
    return () => {
      cancelled = true
      window.removeEventListener('islasafe:unauthenticated', expired)
    }
  }, [accept, clear])

  const signIn = useCallback(async (email: string, password: string, remember = false): Promise<string | null> => {
    if (environment.features.useMockData) { accept({ ...MOCK_USER, email }); return null }
    try {
      await initializeCsrf()
      const { user: account } = await apiFetch<{ user: AuthUser }>('/auth/web/login', {
        method: 'POST', body: { email, password, remember },
      })
      if (account.role !== 'admin') return ADMIN_ONLY_ERROR
      accept(account)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Sign in failed.'
    }
  }, [accept])

  const updateProfile = useCallback(async (input: { name: string; email: string; contact_number: string; office: string; jurisdiction: string; avatar?: File }): Promise<string | null> => {
    if (!user) return 'Your session has expired. Please sign in again.'
    if (environment.features.useMockData) {
      setUser({ ...user, name: input.name, email: input.email, contact_number: input.contact_number || null, office: input.office || null, jurisdiction: input.jurisdiction || null })
      return null
    }
    try {
      const form = new FormData()
      form.append('name', input.name)
      form.append('email', input.email)
      form.append('contact_number', input.contact_number)
      form.append('office', input.office)
      form.append('jurisdiction', input.jurisdiction)
      if (input.avatar) form.append('avatar', input.avatar)
      const response = await apiFetch<{ user: AuthUser }>('/auth/profile', { method: 'PATCH', body: form, sessionKey: sessionKey ?? undefined })
      if (currentSession.current === sessionKey) setUser(response.user)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Failed to update profile.'
    }
  }, [user, sessionKey])

  const signOut = useCallback(async () => {
    if (!environment.features.useMockData) {
      try {
        try {
          await apiFetch('/auth/web/logout', { method: 'POST' })
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 419)) throw error
          // Logout is safe to retry once after refreshing a stale CSRF cookie.
          await initializeCsrf()
          await apiFetch('/auth/web/logout', { method: 'POST' })
        }
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) {
          window.alert('Unable to sign out on the server. Please check your connection and try again.')
          return
        }
      }
    }
    clear()
  }, [clear])

  return { status, user, sessionKey, signIn, signOut, updateProfile }
}
