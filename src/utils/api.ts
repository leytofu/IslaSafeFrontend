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
  token?: string
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
 * Fetch wrapper for the Laravel API: JSON in/out, Bearer token, timeout,
 * and friendly error messages extracted from Laravel validation payloads.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), environment.api.timeoutMs)

  try {
    const response = await fetch(`${environment.api.baseUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
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
