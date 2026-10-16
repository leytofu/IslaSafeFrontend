import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../utils/api'
import type { IncidentPeriod, IncidentStatistics } from '../types/incidents'

export function useIncidentStatistics(sessionKey: string, period: IncidentPeriod, onActiveCount: (count: number) => void) {
  const [data, setData] = useState<IncidentStatistics | null>(null)
  const [error, setError] = useState('')
  const [settledScope, setSettledScope] = useState('')
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  const scope = `${sessionKey}:${period}:${revision}`
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    const version = ++generation.current
    let cancelled = false
    let pending = false
    const load = async () => {
      if (pending) return
      pending = true
      try {
        const response = await apiFetch<{ data: IncidentStatistics }>(`/admin/incidents/statistics?period=${period}`, { sessionKey })
        if (!cancelled && generation.current === version) { setData(response.data); setError(''); onActiveCount(response.data.active_all) }
      } catch (caught) {
        if (!cancelled && generation.current === version) setError(caught instanceof Error ? caught.message : 'Incident statistics are unavailable.')
      } finally {
        pending = false
        if (!cancelled && generation.current === version) setSettledScope(scope)
      }
    }
    void load()
    const timer = window.setInterval(() => { if (!document.hidden) void load() }, 15000)
    const resume = () => { if (!document.hidden) void load() }
    window.addEventListener('online', resume)
    document.addEventListener('visibilitychange', resume)
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume) }
  }, [sessionKey, period, revision, scope, onActiveCount])
  return { data: data?.period === period ? data : null, error: settledScope === scope ? error : '', loading: settledScope !== scope, refresh }
}
