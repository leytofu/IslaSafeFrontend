import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { FilterButton, StatusPill, TableFrame } from '../components/Primitives'
import { SearchField } from '../components/SearchField'
import { statusTone } from '../utils/statusTone'
import { incidentRecords, type IncidentRecord } from '../data/incidentRecords'
import './IncidentMonitoringPage.css'

export function IncidentMonitoringPage() {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const visibleIncidents = incidentRecords.filter((incident) => (filter === 'All' || incident.type === filter) && `${incident.type} ${incident.location}`.toLowerCase().includes(query.toLowerCase()))
  const currentIncidents = visibleIncidents.filter((incident) => incident.period === 'Current')
  const previousIncidents = visibleIncidents.filter((incident) => incident.period === 'Previous')
  const renderIncident = (incident: IncidentRecord) => <tr className="data-table__row" key={incident.id}>
    <td className="cell-id">{incident.id}</td>
    <td className="cell-primary">{incident.type}</td>
    <td className="cell-text">{incident.location}</td>
    <td><StatusPill tone={statusTone(incident.severity)}>{incident.severity}</StatusPill></td>
    <td className="cell-mono">{incident.reported}</td>
    <td><StatusPill tone={statusTone(incident.status)}>{incident.status}</StatusPill></td>
    <td className="cell-text">{incident.affected}</td>
    <td className="data-table__action"><button aria-label={`View ${incident.id}`} className="table-icon-button table-icon-button--lg" type="button"><ChevronRight /></button></td>
  </tr>

  return (
    <div className="page stack-5">
      <div className="toolbar">
        <div className="chip-group">{['All', 'Typhoon', 'Storm surge', 'Intense rains', 'Landslide', 'Strong winds'].map((item) => <FilterButton active={filter === item} key={item} onClick={() => setFilter(item)}>{item}</FilterButton>)}</div>
        <div className="toolbar__actions"><SearchField onChange={setQuery} placeholder="Search incidents..." value={query} /><button className="action-button-primary" type="button"><Plus className="action-button__icon" /> Log incident</button></div>
      </div>
      <div className="table-heading">
        <div><h2 className="table-heading__title">Incident register</h2><p className="table-heading__count">{currentIncidents.length} current &middot; {previousIncidents.length} previous</p></div>
        <p className="table-heading__hint">Current incidents are listed before archived records.</p>
      </div>
      <TableFrame ariaLabel="Incident register" className="data-table--comfortable data-table--modern data-table--readable data-table--soft-corners data-table--scrollable table-frame--capped" tableClassName="data-table--fixed incident-table">
        <caption className="visually-hidden">Current and previous incident records</caption>
        <colgroup><col /><col /><col /><col /><col /><col /><col /><col /></colgroup>
        <thead className="portal-table"><tr><th>ID</th><th>Incident type</th><th>Location</th><th>Severity</th><th>Reported</th><th>Status</th><th>Affected</th><th className="data-table__action">Action</th></tr></thead>
        <tbody className="portal-table">
          {currentIncidents.length > 0 && <tr><td className="data-table__group-label data-table__group-label--current" colSpan={8}>Current incidents &middot; {currentIncidents.length}</td></tr>}
          {currentIncidents.map(renderIncident)}
          {previousIncidents.length > 0 && <tr><td className="data-table__group-label data-table__group-label--previous" colSpan={8}>Previous incidents &middot; {previousIncidents.length}</td></tr>}
          {previousIncidents.map(renderIncident)}
          {visibleIncidents.length === 0 && <tr><td className="cell-empty" colSpan={8}>No incidents match the current search or filter.</td></tr>}
        </tbody>
      </TableFrame>
    </div>
  )
}
