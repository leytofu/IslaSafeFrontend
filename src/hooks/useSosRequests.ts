import { useCallback, useEffect, useRef, useState } from 'react'
import type { SosRequest, SosStatus } from '../data/sosRequests'
import { apiFetch, ApiError } from '../utils/api'
import { toSosRequest, type ApiSosRecord } from '../utils/sosMapper'
import { acknowledgeSosInbox, emptySosInbox, readSosInbox, receiveSosInbox, type SosInbox } from '../utils/sosInbox'

const POLL_INTERVAL_MS = 2_000
interface UseSosRequestsOptions {
  enabled: boolean
  token: string
  canManage: boolean
  accountId: number | null
}
function loadInbox(key: string): SosInbox | null {
  try { return readSosInbox(window.localStorage.getItem(key)) } catch { return null }
}
function saveInbox(key: string, inbox: SosInbox) {
  try { window.localStorage.setItem(key, JSON.stringify(inbox)) } catch { /* Memory still preserves the alarm for this tab. */ }
}

/** Real resident submissions only. Polling needs no separate WebSocket server. */
export function useSosRequests({ enabled, token, canManage, accountId }: UseSosRequestsOptions) {
  const [requests, setRequests] = useState<SosRequest[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const inbox = useRef(emptySosInbox())
  const updates = useRef(new Set<string>())
  const revision = useRef(0)
  const refreshRef = useRef<(() => Promise<void>) | null>(null)
  const activeToken = useRef(token)
  const storageKey = accountId === null ? null : `islasafe.sos.inbox.${accountId}`
  const pollingEnabled = enabled && canManage && token.length > 0 && storageKey !== null

  useEffect(() => {
    activeToken.current = token
    revision.current++
    updates.current.clear()
    // oxlint-disable-next-line react/set-state-in-effect -- Invalidate the authenticated API cache when its session changes.
    setRequests([]); setError(''); setUpdatedAt(null)
    if (!pollingEnabled || !storageKey) {
      inbox.current = emptySosInbox(); setUnreadCount(0); setLoading(false)
      return
    }
    inbox.current = loadInbox(storageKey) ?? emptySosInbox()
    setUnreadCount(inbox.current.unreadIds.length)
    setLoading(true)
    let cancelled = false
    let fetching = false
    let unauthorized = false
    const poll = async () => {
      if (cancelled || fetching || unauthorized || updates.current.size > 0) return
      fetching = true
      const version = revision.current
      try {
        const response = await apiFetch<{ data: ApiSosRecord[] }>('/sos-requests', { token })
        if (cancelled || version !== revision.current) return
        const mapped = response.data.map(toSosRequest)
        // Re-read IDs so acknowledging in another admin tab is respected.
        inbox.current = receiveSosInbox(loadInbox(storageKey) ?? inbox.current, mapped)
        saveInbox(storageKey, inbox.current)
        setUnreadCount(inbox.current.unreadIds.length)
        setRequests(mapped); setError(''); setUpdatedAt(new Date())
      } catch (caught) {
        if (cancelled) return
        unauthorized = caught instanceof ApiError && (caught.status === 401 || caught.status === 403)
        setError(unauthorized ? 'SOS monitoring stopped. Sign in again with an Admin account.' : 'SOS updates are unavailable. Existing records may be out of date. Check the connection and refresh the queue.')
      } finally {
        fetching = false
        if (!cancelled) setLoading(false)
      }
    }
    refreshRef.current = async () => { unauthorized = false; await poll() }
    const resume = () => { if (document.visibilityState === 'visible') void poll() }
    const online = () => { void poll() }
    const storage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      const next = readSosInbox(event.newValue)
      if (next) { inbox.current = next; setUnreadCount(next.unreadIds.length) }
    }
    void poll()
    const timer = window.setInterval(() => { void poll() }, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', online)
    window.addEventListener('storage', storage)
    return () => {
      cancelled = true; refreshRef.current = null
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', online)
      window.removeEventListener('storage', storage)
    }
  }, [pollingEnabled, storageKey, token])

  const acknowledgeRequests = useCallback(() => {
    if (!pollingEnabled || !storageKey) return
    inbox.current = acknowledgeSosInbox(loadInbox(storageKey) ?? inbox.current)
    saveInbox(storageKey, inbox.current)
    setUnreadCount(0)
  }, [pollingEnabled, storageKey])
  const refresh = useCallback(async () => { await refreshRef.current?.() }, [])
  const updateStatus = useCallback(async (id: string, status: SosStatus) => {
    if (!pollingEnabled) throw new Error('Sign in as Admin to update an SOS request.')
    if (updates.current.has(id)) return
    updates.current.add(id); revision.current++
    try {
      const response = await apiFetch<{ data: ApiSosRecord }>(`/sos-requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, token })
      if (activeToken.current !== token) return
      const saved = toSosRequest(response.data)
      setRequests(current => current.map(request => request.id === saved.id ? saved : request))
    } finally {
      updates.current.delete(id)
    }
  }, [pollingEnabled, token])

  return { requests, unreadCount: pollingEnabled ? unreadCount : 0, pendingCount: requests.filter(request => request.status === 'Pending').length,
    loading, error, updatedAt, refresh, updateStatus, acknowledgeRequests }
}
