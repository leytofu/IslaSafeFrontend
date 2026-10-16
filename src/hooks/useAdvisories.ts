import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import type { AdvisoryRecord } from '../data/advisoryRecords'

export function useAdvisories(sessionKey: string) {
  const [state, setState] = useState<{ key: string; items: AdvisoryRecord[]; error: string; loaded: boolean }>({ key: sessionKey, items: [], error: '', loaded: false })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion(value => value + 1), [])
  useEffect(() => {
    let live = true
    let pending = false
    const refresh = async () => {
      if (pending) return
      pending = true
      try {
        const result = await apiFetch<{ data: AdvisoryRecord[] }>('/admin/advisories', { sessionKey })
        if (live) setState({ key: sessionKey, items: result.data, error: '', loaded: true })
      } catch (error) {
        if (live) setState(previous => ({ key: sessionKey, items: previous.key === sessionKey ? previous.items : [], loaded: true, error: error instanceof Error ? error.message : 'Unable to load advisories.' }))
      } finally { pending = false }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 30000)
    const focus = () => void refresh()
    window.addEventListener('focus', focus)
    return () => { live = false; window.clearInterval(timer); window.removeEventListener('focus', focus) }
  }, [sessionKey, version])
  const current = state.key === sessionKey ? state : { items: [], error: '', loaded: false }
  return { ...current, reload, active: current.items.filter(item => item.status === 'Active') }
}
