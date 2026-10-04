import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { MetricTile, StatusPill, TableFrame } from '../components/Primitives'
import { SosRequestDetailDialog } from '../components/SosRequestDetailDialog'
import type { SosRequest, SosStatus } from '../data/sosRequests'
import { SearchField } from '../components/SearchField'
import { statusTone } from '../utils/statusTone'
import './SosManagementPage.css'

interface SosManagementPageProps {
  requests: SosRequest[]
  selectedRequestId: string | null
  onClearSelectedRequest: () => void
  onUpdateStatus: (id: string, status: SosStatus) => void
  onIncomingSos: () => void
}

export function SosManagementPage({ requests, selectedRequestId, onClearSelectedRequest, onUpdateStatus, onIncomingSos }: SosManagementPageProps) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [tableSelectedId, setTableSelectedId] = useState<string | null>(null)
  const visibleRequests = requests.filter((request) => (filter === 'All' || request.status === filter) && `${request.name} ${request.location} ${request.id}`.toLowerCase().includes(query.toLowerCase()))
  const selectedRequest = requests.find((request) => request.id === (selectedRequestId ?? tableSelectedId))
  const closeDetail = () => { setTableSelectedId(null); onClearSelectedRequest() }

  return (
    <div className="page stack-5">
      <section className="metric-grid">
        <MetricTile detail="Requires immediate triage" label="Pending" tone="danger" value={requests.filter((request) => request.status === 'Pending').length} />
        <MetricTile detail="Teams currently assigned" label="Response coming" tone="info" value={requests.filter((request) => request.status === 'Coming').length} />
        <MetricTile detail="Since 12:00 AM" label="Resolved today" tone="success" value={requests.filter((request) => request.status === 'Resolved').length} />
        <MetricTile detail="2.1 min faster than target" label="Average response" tone="warning" value={<>9.4<span className="metric-unit">min</span></>} />
      </section>
      <div className="toolbar">
        <div className="chip-group">{['All', 'Pending', 'Coming', 'Resolved'].map((item) => <button className={`filter-chip${filter === item ? ' active' : ''}`} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
        <div className="toolbar__actions"><SearchField onChange={setQuery} placeholder="Search by name, barangay..." value={query} /><button className="action-button-primary" onClick={onIncomingSos} type="button"><BellRing className="action-button__icon" /> Simulate incoming SOS</button></div>
      </div>
      <div className="table-heading">
        <div><h2 className="table-heading__title">SOS request queue</h2><p className="table-heading__count">{visibleRequests.length} {visibleRequests.length === 1 ? 'request' : 'requests'} shown</p></div>
        <p className="table-heading__hint">Select a request to review the resident details.</p>
      </div>
      <TableFrame ariaLabel="SOS request queue" className="data-table--comfortable data-table--modern data-table--readable data-table--soft-corners data-table--scrollable table-frame--capped" tableClassName="data-table--fixed sos-table">
        <caption className="visually-hidden">SOS requests from residents</caption>
        <colgroup><col /><col /><col /><col /><col /><col /><col /><col /></colgroup>
        <thead className="portal-table"><tr><th>SOS ID</th><th>Resident</th><th>Barangay / Purok</th><th>Request</th><th>Priority</th><th>Time</th><th>Status</th><th className="data-table__action">Action</th></tr></thead>
        <tbody className="portal-table">
          {visibleRequests.map((request) => <tr className="data-table__row" key={request.id}>
            <td className="cell-id">{request.id}</td>
            <td><p className="cell-primary">{request.name}</p><p className="cell-sub">{request.contact}</p></td>
            <td className="cell-text">{request.location}</td>
            <td><p className="cell-label">{request.type}</p><p className="cell-subtext">{request.category}</p></td>
            <td className="cell-nowrap"><StatusPill tone={statusTone(request.priority)}>{request.priority}</StatusPill></td>
            <td className="cell-mono">{request.received}</td>
            <td><StatusPill tone={statusTone(request.status)}>{request.status}</StatusPill></td>
            <td className="data-table__action"><button aria-label={`View ${request.id} details`} className="table-action-button" onClick={() => setTableSelectedId(request.id)} type="button">View details</button></td>
          </tr>)}
          {visibleRequests.length === 0 && <tr><td className="cell-empty" colSpan={8}>No SOS requests match the current search or status filter.</td></tr>}
        </tbody>
      </TableFrame>
      {selectedRequest && <SosRequestDetailDialog onClose={closeDetail} onUpdateStatus={onUpdateStatus} request={selectedRequest} />}
    </div>
  )
}
