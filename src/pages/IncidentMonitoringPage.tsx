import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { FilterButton, StatusPill, TableFrame } from '../components/Primitives'
import { SearchField } from '../components/SearchField'
import { statusTone } from '../utils/statusTone'
import { incidentRecords, type IncidentRecord } from '../data/incidentRecords'

export function IncidentMonitoringPage() {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const visibleIncidents = incidentRecords.filter((incident) => (filter === 'All' || incident.type === filter) && `${incident.type} ${incident.location}`.toLowerCase().includes(query.toLowerCase()))
  const currentIncidents = visibleIncidents.filter((incident) => incident.period === 'Current')
  const previousIncidents = visibleIncidents.filter((incident) => incident.period === 'Previous')
  const renderIncident = (incident: IncidentRecord) => <tr className="data-table__row" key={incident.id}>
    <td className="font-mono text-[11px] text-indigo-200">{incident.id}</td>
    <td className="font-semibold text-slate-100">{incident.type}</td>
    <td className="leading-5 text-slate-200">{incident.location}</td>
    <td><StatusPill tone={statusTone(incident.severity)}>{incident.severity}</StatusPill></td>
    <td className="font-mono text-[10px] text-slate-400">{incident.reported}</td>
    <td><StatusPill tone={statusTone(incident.status)}>{incident.status}</StatusPill></td>
    <td className="leading-5 text-slate-200">{incident.affected}</td>
    <td className="data-table__action text-right"><button aria-label={`View ${incident.id}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white" type="button"><ChevronRight className="size-4" /></button></td>
  </tr>

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">{['All', 'Typhoon', 'Storm surge', 'Intense rains', 'Landslide', 'Strong winds'].map((item) => <FilterButton active={filter === item} key={item} onClick={() => setFilter(item)}>{item}</FilterButton>)}</div>
        <div className="flex flex-1 flex-wrap gap-2 lg:justify-end"><SearchField onChange={setQuery} placeholder="Search incidents..." value={query} /><button className="action-button-primary" type="button"><Plus className="size-3.5" /> Log incident</button></div>
      </div>
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-2 px-1 sm:px-2">
        <div><h2 className="font-display text-sm font-semibold text-slate-100">Incident register</h2><p className="mt-1 text-xs text-slate-500">{currentIncidents.length} current &middot; {previousIncidents.length} previous</p></div>
        <p className="text-[11px] text-slate-500">Current incidents are listed before archived records.</p>
      </div>
      <TableFrame ariaLabel="Incident register" className="data-table--comfortable data-table--modern data-table--readable data-table--soft-corners data-table--scrollable mx-auto max-w-[1320px]" tableClassName="min-w-[1060px] table-fixed">
        <caption className="sr-only">Current and previous incident records</caption>
        <colgroup><col className="w-[112px]" /><col className="w-[165px]" /><col className="w-[190px]" /><col className="w-[120px]" /><col className="w-[138px]" /><col className="w-[126px]" /><col className="w-[160px]" /><col className="w-[78px]" /></colgroup>
        <thead className="portal-table"><tr><th>ID</th><th>Incident type</th><th>Location</th><th>Severity</th><th>Reported</th><th>Status</th><th>Affected</th><th className="data-table__action text-right">Action</th></tr></thead>
        <tbody className="portal-table">
          {currentIncidents.length > 0 && <tr><td className="data-table__group-label bg-indigo-500/[0.07] text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-200" colSpan={8}>Current incidents &middot; {currentIncidents.length}</td></tr>}
          {currentIncidents.map(renderIncident)}
          {previousIncidents.length > 0 && <tr><td className="data-table__group-label border-t border-white/10 bg-white/[0.025] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400" colSpan={8}>Previous incidents &middot; {previousIncidents.length}</td></tr>}
          {previousIncidents.map(renderIncident)}
          {visibleIncidents.length === 0 && <tr><td className="px-5 py-12 text-center text-xs text-slate-500" colSpan={8}>No incidents match the current search or filter.</td></tr>}
        </tbody>
      </TableFrame>
    </div>
  )
}
