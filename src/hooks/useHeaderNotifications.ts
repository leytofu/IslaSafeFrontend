import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../utils/api'
import type { NotificationResponse } from '../types/header'

export function useHeaderNotifications(sessionKey: string) {
  const [response, setResponse] = useState<NotificationResponse>({ data: [], unread_count: 0 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const generation = useRef(0)
  const marking = useRef(false)
  const refreshRef = useRef<() => Promise<void>>(async () => {})
  useEffect(() => {
    let active = true
    let pending = false
    const load = async () => {
      if (pending || marking.current) return
      pending = true
      const version = ++generation.current
      try {
        const data = await apiFetch<NotificationResponse>('/admin/notifications', { sessionKey })
        if (active && version === generation.current) { setResponse(data); setError('') }
      } catch (caught) { if (active && version === generation.current) setError(caught instanceof Error ? caught.message : 'Notifications are unavailable.') }
      finally { pending = false; if (active) setLoading(false) }
    }
    refreshRef.current = load
    void load()
    const timer = window.setInterval(() => { if (!document.hidden) void load() }, 15000)
    const resume = () => { if (!document.hidden) void load() }
    document.addEventListener('visibilitychange', resume); window.addEventListener('online', resume); window.addEventListener('focus', resume)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- This generation counter invalidates in-flight writes on session teardown.
    return () => { active = false; generation.current++; clearInterval(timer); document.removeEventListener('visibilitychange', resume); window.removeEventListener('online', resume); window.removeEventListener('focus', resume) }
  }, [sessionKey])
  const markRead = useCallback(async (keys: string[]) => {
    if (!keys.length || marking.current) return
    marking.current = true; setSaving(true)
    const version = ++generation.current
    try {
      const data = await apiFetch<NotificationResponse>('/admin/notifications/read', { method: 'POST', body: { keys }, sessionKey })
      if (version === generation.current) { setResponse(data); setError('') }
    } catch (caught) { if (version === generation.current) setError(caught instanceof Error ? caught.message : 'Unable to mark notifications as read.') }
    finally { marking.current = false; setSaving(false) }
  }, [sessionKey])
  return { ...response, error, loading, saving, markRead, refresh: () => refreshRef.current() }
}
