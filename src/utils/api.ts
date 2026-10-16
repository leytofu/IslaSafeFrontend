import { environment } from '../config/environment'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Non-secret generation identifier scopes expiry events to the active UI. */
  sessionKey?: string
  timeoutMs?: number
}

function readCsrfCookie(): string {
  const cookie = document.cookie.split('; ').find((value) => value.startsWith('XSRF-TOKEN='))
  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : ''
}

export async function initializeCsrf(signal: AbortSignal = AbortSignal.timeout(environment.api.timeoutMs)): Promise<void> {
  const apiUrl = new URL(environment.api.baseUrl, window.location.origin)
  const response = await fetch(new URL('/sanctum/csrf-cookie', apiUrl), {
    credentials: 'include', headers: { Accept: 'application/json' }, signal,
  })
  if (!response.ok) throw new ApiError('Unable to initialize a secure session. Please try again.', response.status)
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    const firstError = Object.values(payload?.errors ?? {})[0]
    if (Array.isArray(firstError) && typeof firstError[0] === 'string') {
      return firstError[0]
    }
    if (typeof payload?.message === 'string' && payload.message) {
      return payload.message
    }
  } catch {
    // Non-JSON error body — fall through to the status fallback.
  }
  return `Request failed (${response.status})`
}

/**
 * Fetch wrapper for the Laravel API: JSON in/out, session cookies, timeout,
 * and friendly error messages extracted from Laravel validation payloads.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, sessionKey, timeoutMs = environment.api.timeoutMs } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    // FormData bodies (file uploads) must not be JSON-stringified — the
    // browser sets the multipart boundary automatically.
    const isFormData = body instanceof FormData
    if (method !== 'GET' && !readCsrfCookie()) await initializeCsrf(controller.signal)

    const response = await fetch(`${environment.api.baseUrl}${path}`, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'X-XSRF-TOKEN': readCsrfCookie() } : {}),
      },
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    })

    if (!response.ok) {
      if (response.status === 401) window.dispatchEvent(new CustomEvent('islasafe:unauthenticated', { detail: sessionKey }))
      throw new ApiError(await readErrorMessage(response), response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Is the backend running?', 0)
    }
    throw new ApiError('Cannot reach the backend server. Is `php artisan serve` running?', 0)
  } finally {
    window.clearTimeout(timer)
  }
}
