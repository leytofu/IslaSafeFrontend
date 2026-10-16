import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import type { LiveCenter, Page } from '../types/evacuation'
export function EvacuationCenterLookup({ sessionKey, value, onChange, exclude, operational = false, label }: { sessionKey: string; value: string; onChange: (value: string) => void; exclude?: number; operational?: boolean; label: string }) {
  const [query, setQuery] = useState('')
  const [centers, setCenters] = useState<LiveCenter[]>([])
  const [page, setPage] = useState(1); const [lastPage, setLastPage] = useState(1)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => { void apiFetch<Page<LiveCenter>>(`/admin/evacuation/centers?q=${encodeURIComponent(query)}&page=${page}`, { sessionKey }).then((response) => { if (active) { setCenters(response.data); setLastPage(response.last_page); setError('') } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to find centers.') }) }, 350)
    return () => { active = false; clearTimeout(timer) }
  }, [sessionKey, query, page])
  return <div className="stack-3"><label className="field">{label}<input className="evac-filter" placeholder="Search all centers by name" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); onChange('') }} /></label><select className="evac-filter" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select center</option>{centers.filter((center) => center.id !== exclude && (!operational || center.status === 'Operational')).map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}</select>{error && <p role="alert">{error}</p>}{lastPage > 1 && <div className="evac-toolbar"><button type="button" disabled={page <= 1} onClick={() => { setPage(page - 1); onChange('') }}>Previous centers</button><span>{page} / {lastPage}</span><button type="button" disabled={page >= lastPage} onClick={() => { setPage(page + 1); onChange('') }}>More centers</button></div>}</div>
}
