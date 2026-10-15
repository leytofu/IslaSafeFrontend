import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../utils/api'
import type { Registration } from '../types/evacuation'
import { EvacuationCenterLookup } from './EvacuationCenterLookup'

type GenderRoster = { key: string; title: string; page_key: string; data: Registration[]; total: number; current_page: number; last_page: number }
type AgeRoster = { key: string; title: string; range: string; total: number; genders: GenderRoster[] }
type GroupedResponse = { data: AgeRoster[]; total: number; event: { name: string } | null; places: { id: number; barangay: string }[] }
const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())

export function GroupedEvacuees({ id, token, revision, places, onChange }: { id: number; token: string; revision: number; places: { id: number; barangay: string }[]; onChange: () => Promise<void> }) {
  const [result, setResult] = useState<GroupedResponse | null>(null)
  const [query, setQuery] = useState(''); const [place, setPlace] = useState(''); const [status, setStatus] = useState('')
  const [pages, setPages] = useState<Record<string, number>>({})
  const [target, setTarget] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const lock = useRef(false)
  const load = useCallback(() => {
    const params = new URLSearchParams({ q: query, place_id: place, status })
    Object.entries(pages).forEach(([key, value]) => params.set(key, String(value)))
    return apiFetch<GroupedResponse>(`/admin/evacuation/centers/${id}/grouped-registrations?${params}`, { token })
  }, [id, token, query, place, status, pages])
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => { setLoading(true); void load().then((response) => { if (active) { setResult(response); setError('') } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load registered evacuees.') }).finally(() => { if (active) setLoading(false) }) }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [load, revision])
  async function move(row: Registration, action: string) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try {
      await apiFetch(`/admin/evacuation/registrations/${row.id}`, { token, method: 'PATCH', body: { action, ...(action === 'transfer' ? { center_id: Number(target) } : {}) } })
      setResult(await load()); await onChange()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update registration.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="grouped-roster" aria-label="Registered evacuees">
    <div className="evac-roster-heading"><div><h3>Registered evacuees</h3><p className="evac-live-event">{result?.event?.name ?? 'No active event'} - Active-event registrations at this center. Ages are recorded at registration.</p></div><strong aria-live="polite">{result?.total ?? 0} matching registrations</strong></div>
    <div className="evac-toolbar evac-roster-filters">
      <input className="evac-filter" aria-label="Search center roster" placeholder="Search evacuees..." maxLength={120} value={query} disabled={busy} onChange={(event) => { setQuery(event.target.value); setPages({}) }} />
      <select aria-label="Filter roster by barangay" className="evac-filter" value={place} disabled={busy} onChange={(event) => { setPlace(event.target.value); setPages({}) }}><option value="">All barangays</option>{(result?.places ?? places).map((item) => <option key={item.id} value={item.id}>{item.barangay}</option>)}</select>
      <select aria-label="Filter registration status" className="evac-filter" value={status} disabled={busy} onChange={(event) => { setStatus(event.target.value); setPages({}) }}><option value="">All registrations</option><option value="checked_in">Checked in</option><option value="checked_out">Checked out</option></select>
    </div>
    <details className="evac-transfer"><summary>Transfer an evacuee to another center</summary><EvacuationCenterLookup token={token} label="Transfer destination" value={target} onChange={setTarget} exclude={id} operational /></details>
    {error && <p role="alert" className="fp-error">{error}</p>}
    {loading && <p role="status">Loading registered evacuees...</p>}
    {!loading && result?.total === 0 && <p className="evac-empty">No registered evacuees match these filters.</p>}
    <div className="evac-age-grid" aria-busy={loading}>
      {result?.data.map((group) => <section className="evac-age-group" key={group.key} aria-label={group.title}>
        <header className="evac-age-header"><div><h4>{group.title}</h4><span>{group.range}</span></div><strong>{group.total}</strong></header>
        {group.genders.map((gender) => <section className="evac-gender-group" key={gender.key} aria-label={`${group.title} - ${gender.title}`}>
          <h5>{gender.title}<span>{gender.total}</span></h5>
          {gender.data.length === 0 ? <p className="evac-empty">{gender.total ? 'No records on this page. Use Previous.' : 'No registered evacuees.'}</p> : <ul className="evac-person-list">{gender.data.map((row) => <li key={row.id}>
            <div className="evac-person-heading"><strong>{row.full_name}</strong><span className={`status-pill status-pill--${row.status === 'checked_in' ? 'success' : 'muted'}`}>{label(row.status)}</span></div>
            <p>ID {row.evacuee_id} - {row.age === null ? 'Age unknown' : `${row.age} years`} - {label(row.gender)}</p>
            <p>{row.place.barangay}{row.purok ? ` / ${row.purok}` : ''}</p>
            <time dateTime={row.registered_at}>Registered {new Date(row.registered_at).toLocaleString()}</time>
            <div className="evac-person-actions"><button className="auth-link" disabled={busy || loading || !!error} type="button" onClick={() => void move(row, row.status === 'checked_in' ? 'check_out' : 'check_in')}>{row.status === 'checked_in' ? 'Check out' : 'Check in'}</button>{row.status === 'checked_in' && <button className="auth-link" disabled={busy || loading || !target || !!error} type="button" onClick={() => void move(row, 'transfer')}>Transfer</button>}</div>
          </li>)}</ul>}
          {gender.last_page > 1 && <nav className="evac-group-pagination" aria-label={`${group.title} ${gender.title} pages`}><button className="action-button" type="button" disabled={busy || loading || gender.current_page <= 1} onClick={() => setPages((current) => ({ ...current, [gender.page_key]: gender.current_page - 1 }))}>Previous</button><span>{gender.current_page} / {gender.last_page}</span><button className="action-button" type="button" disabled={busy || loading || gender.current_page >= gender.last_page} onClick={() => setPages((current) => ({ ...current, [gender.page_key]: gender.current_page + 1 }))}>Next</button></nav>}
        </section>)}
      </section>)}
    </div>
  </section>
}
