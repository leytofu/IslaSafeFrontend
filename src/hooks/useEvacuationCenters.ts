import { useCallback, useEffect, useRef, useState } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { apiFetch } from '../utils/api'
import type { LiveCenter, Page } from '../types/evacuation'

export function useEvacuationCenters(sessionKey: string, query: string) {
  const [centers, setCenters] = useState<LiveCenter[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [connection, setConnection] = useState('Refresh fallback')
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  const invalidate = useCallback(() => { generation.current++ }, [])
  const refresh = useCallback(async () => {
    const request = ++generation.current
    try {
      // The API stays paginated for center lookups. Collect every directory
      // page so scrolling can reach every saved facility without page controls.
      const response = await apiFetch<Page<LiveCenter>>(`/admin/evacuation/centers?page=1&q=${encodeURIComponent(query)}`, { sessionKey })
      if (request !== generation.current) return
      const collected = [...response.data]
      for (let nextPage = 2; nextPage <= response.last_page; nextPage++) {
        const next = await apiFetch<Page<LiveCenter>>(`/admin/evacuation/centers?page=${nextPage}&q=${encodeURIComponent(query)}`, { sessionKey })
        if (request !== generation.current) return
        collected.push(...next.data)
      }
      if (request === generation.current) {
        setCenters([...new Map(collected.map((center) => [center.id, center])).values()])
        setError(''); setRevision((value) => value + 1)
      }
    } catch (caught) { if (request === generation.current) setError(caught instanceof Error ? caught.message : 'Unable to refresh centers.') }
    finally { if (request === generation.current) setLoading(false) }
  }, [sessionKey, query])
  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 250)
    const poll = window.setInterval(() => { if (!document.hidden) void refresh() }, 15000)
    const resume = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', resume); window.addEventListener('online', resume)
    return () => { invalidate(); clearTimeout(timer); clearInterval(poll); document.removeEventListener('visibilitychange', resume); window.removeEventListener('online', resume) }
  }, [refresh, invalidate])
  useEffect(() => {
    const key = import.meta.env.VITE_REVERB_APP_KEY?.trim()
    if (!key || !sessionKey) return
    let active = true
    const echo = new Echo({ broadcaster: 'reverb', Pusher, key, wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost', wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080), wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443), forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https', enabledTransports: ['ws', 'wss'],
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          apiFetch<{ auth: string }>('/broadcasting/auth', { method: 'POST', body: { socket_id: socketId, channel_name: channel.name } })
            .then((data) => callback(null, data))
            .catch((error: unknown) => callback(error instanceof Error ? error : new Error('Live update authentication failed.'), null))
        },
      }),
    })
    const connected = () => { if (active) { setConnection('Live updates connected'); void refreshRef.current() } }
    const disconnected = () => { if (active) setConnection('Refresh fallback · WebSocket disconnected') }
    echo.private('evacuation.admin').subscribed(connected).error(disconnected).listen('.center.updated', () => {
      // Requery membership and ordering as well as occupancy: a new center may
      // belong on this page, and an edited name may no longer match the filter.
      if (active) void refreshRef.current()
    })
    const socket = echo.connector.pusher.connection
    socket.bind('disconnected', disconnected); socket.bind('unavailable', disconnected); socket.bind('error', disconnected)
    return () => { active = false; socket.unbind('disconnected', disconnected); socket.unbind('unavailable', disconnected); socket.unbind('error', disconnected); echo.leave('evacuation.admin'); echo.disconnect() }
  }, [sessionKey])
  return { centers, error, loading, connection, revision, refresh }
}
