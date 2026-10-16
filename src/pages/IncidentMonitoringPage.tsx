import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { FilterButton, StatusPill, TableFrame } from '../components/Primitives'
import { SearchField } from '../components/SearchField'
import { IncidentDialog } from '../components/IncidentDialog'
import { statusTone } from '../utils/statusTone'
import { apiFetch } from '../utils/api'
import { incidentTypes, isActiveIncident, type Incident } from '../types/incidents'
import './IncidentMonitoringPage.css'

export function IncidentMonitoringPage({ sessionKey, initialIncidentId = null, onClearInitial }: { sessionKey: string; initialIncidentId?: number | null; onClearInitial?: () => void }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Incident | null | undefined>(undefined)
  const selectedIncident = editing === undefined && initialIncidentId !== null ? incidents.find((incident) => incident.id === initialIncidentId) : editing
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    const version = ++generation.current
    let active = true
    let pending = false
    const load = async () => {
      if (pending) return
      pending = true
      try {
        const response = await apiFetch<{ data: Incident[] }>('/admin/incidents', { sessionKey })
        if (active && version === generation.current) { setIncidents(response.data); setError('') }
      } catch (caught) { if (active && version === generation.current) setError(caught instanceof Error ? caught.message : 'Unable to load incidents.') }
      finally { pending = false; if (active && version === generation.current) setLoading(false) }
    }
    void load()
    const timer = window.setInterval(() => { if (!document.hidden) void load() }, 15000)
    const resume = () => { if (!document.hidden) void load() }
    window.addEventListener('online', resume); document.addEventListener('visibilitychange', resume)
    return () => { active = false; clearInterval(timer); window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume) }
  }, [sessionKey, revision])
  const visibleIncidents = incidents.filter((incident) => (filter === 'All' || incident.type === filter) && `${incident.type} ${incident.location} INC-${String(incident.id).padStart(4, '0')}`.toLowerCase().includes(query.toLowerCase()))
  const currentIncidents = visibleIncidents.filter((incident) => isActiveIncident(incident.status))
  const previousIncidents = visibleIncidents.filter((incident) => !isActiveIncident(incident.status))
  const renderIncident = (incident: Incident) => <tr className="data-table__row" key={incident.id}>
    <td className="cell-id">INC-{String(incident.id).padStart(4, '0')}</td>
    <td className="cell-primary">{incident.type}</td>
    <td className="cell-text">{incident.location}</td>
    <td><StatusPill tone={statusTone(incident.severity)}>{incident.severity}</StatusPill></td>
    <td className="cell-mono"><time dateTime={incident.reported_at}>{new Date(incident.reported_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></td>
    <td><StatusPill tone={statusTone(incident.status)}>{incident.status}</StatusPill></td>
    <td className="cell-text">{incident.affected || 'Not recorded'}</td>
    <td className="data-table__action"><button aria-label={`View or edit incident INC-${String(incident.id).padStart(4, '0')}`} className="table-icon-button table-icon-button--lg" onClick={() => setEditing(incident)} type="button"><ChevronRight /></button></td>
  </tr>
  return (
    <div className="page stack-5">
      <div className="toolbar">
        <div className="chip-group">{['All', ...incidentTypes].map((item) => <FilterButton active={filter === item} key={item} onClick={() => setFilter(item)}>{item}</FilterButton>)}</div>
        <div className="toolbar__actions"><SearchField onChange={setQuery} placeholder="Search incidents..." value={query} /><button className="action-button-primary" onClick={() => setEditing(null)} type="button"><Plus className="action-button__icon" /> Log incident</button></div>
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && <div className="incident-breakdown__error" role="alert"><span>{incidents.length > 0 ? 'Showing the last successful update. ' : ''}{error}</span><button className="action-button" onClick={refresh} type="button">Retry</button></div>}
      <div className="table-heading"><div><h2 className="table-heading__title">Incident register</h2><p className="table-heading__count">{loading ? 'Loading incidents…' : `${currentIncidents.length} current · ${previousIncidents.length} previous`}</p></div><p className="table-heading__hint">Reported times use Philippine time. Updates every 15 seconds.</p></div>
      <TableFrame ariaLabel="Incident register" className="data-table--comfortable data-table--modern data-table--readable data-table--soft-corners data-table--scrollable table-frame--capped" tableClassName="data-table--fixed incident-table">
        <caption className="visually-hidden">Current and previous saved incident records</caption>
        <colgroup><col /><col /><col /><col /><col /><col /><col /><col /></colgroup>
        <thead className="portal-table"><tr><th>ID</th><th>Incident type</th><th>Location</th><th>Severity</th><th>Reported</th><th>Status</th><th>Affected</th><th className="data-table__action">Action</th></tr></thead>
        <tbody className="portal-table">
          {currentIncidents.length > 0 && <tr><td className="data-table__group-label data-table__group-label--current" colSpan={8}>Current incidents · {currentIncidents.length}</td></tr>}
          {currentIncidents.map(renderIncident)}
          {previousIncidents.length > 0 && <tr><td className="data-table__group-label data-table__group-label--previous" colSpan={8}>Previous incidents · {previousIncidents.length}</td></tr>}
          {previousIncidents.map(renderIncident)}
          {!loading && !error && visibleIncidents.length === 0 && <tr><td className="cell-empty" colSpan={8}>{incidents.length ? 'No incidents match the current search or filter.' : 'No incidents logged yet. Use Log incident to add your first report.'}</td></tr>}
        </tbody>
      </TableFrame>
      {selectedIncident !== undefined && <IncidentDialog key={selectedIncident?.id ?? 'new'} incident={selectedIncident} sessionKey={sessionKey} onClose={() => { setEditing(undefined); onClearInitial?.() }} onSaved={() => { setEditing(undefined); onClearInitial?.(); setNotice('Incident saved. Dashboard statistics will reflect this report.'); refresh() }} />}
    </div>
  )
}
