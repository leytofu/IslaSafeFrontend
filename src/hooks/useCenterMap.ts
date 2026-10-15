import { useCallback, useEffect, useRef, useState } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { apiFetch } from '../utils/api'
import type { MapCenter } from '../types/evacuation'

export function useCenterMap(token: string) {
  const [centers, setCenters] = useState<MapCenter[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const generation = useRef(0)
  const invalidate = useCallback(() => { generation.current++ }, [])
  const refresh = useCallback(async () => {
    const request = ++generation.current
    try {
      const result = await apiFetch<{ data: MapCenter[] }>('/admin/evacuation/map', { token })
      if (request === generation.current) { setCenters(result.data); setError('') }
    } catch (caught) {
      if (request === generation.current) setError(caught instanceof Error ? caught.message : 'Unable to update center locations.')
    } finally { if (request === generation.current) setLoading(false) }
  }, [token])
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0)
    const resume = () => { if (!document.hidden) void refresh() }
    const poll = window.setInterval(resume, 15000)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    window.addEventListener('evacuation-centers-changed', resume)
    const key = import.meta.env.VITE_REVERB_APP_KEY?.trim()
    const echo = key ? new Echo({ broadcaster: 'reverb', Pusher, key,
      wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost', wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443), forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https', enabledTransports: ['ws', 'wss'],
    }) : null
    echo?.channel('evacuation.centers').subscribed(resume).listen('.center.updated', resume)
    return () => {
      invalidate(); clearTimeout(initial); clearInterval(poll); echo?.disconnect()
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
      window.removeEventListener('evacuation-centers-changed', resume)
    }
  }, [refresh, invalidate])
  return { centers, error, loading, refresh }
}
