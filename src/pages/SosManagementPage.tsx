import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { MetricTile, StatusPill, TableFrame } from '../components/Primitives'
import { SosRequestDetailDialog } from '../components/SosRequestDetailDialog'
import type { SosRequest, SosStatus } from '../data/sosRequests'
import { SearchField } from '../components/SearchField'
import { statusTone } from '../utils/statusTone'

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
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile detail="Requires immediate triage" label="Pending" tone="danger" value={requests.filter((request) => request.status === 'Pending').length} />
        <MetricTile detail="Teams currently assigned" label="Response coming" tone="info" value={requests.filter((request) => request.status === 'Coming').length} />
        <MetricTile detail="Since 12:00 AM" label="Resolved today" tone="success" value={requests.filter((request) => request.status === 'Resolved').length} />
        <MetricTile detail="2.1 min faster than target" label="Average response" tone="warning" value={<>9.4<span className="ml-1 text-sm">min</span></>} />
      </section>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">{['All', 'Pending', 'Coming', 'Resolved'].map((item) => <button className={`filter-chip ${filter === item ? 'active' : ''}`} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
        <div className="flex flex-1 flex-wrap gap-2 lg:justify-end"><SearchField onChange={setQuery} placeholder="Search by name, barangay..." value={query} /><button className="action-button-primary" onClick={onIncomingSos} type="button"><BellRing className="size-3.5" /> Simulate incoming SOS</button></div>
      </div>
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-2 px-1 sm:px-2">
        <div><h2 className="font-display text-sm font-semibold text-slate-100">SOS request queue</h2><p className="mt-1 text-xs text-slate-500">{visibleRequests.length} {visibleRequests.length === 1 ? 'request' : 'requests'} shown</p></div>
        <p className="text-[11px] text-slate-500">Select a request to review the resident details.</p>
      </div>
      <TableFrame ariaLabel="SOS request queue" className="data-table--comfortable data-table--modern data-table--readable data-table--soft-corners data-table--scrollable mx-auto max-w-[1320px]" tableClassName="min-w-[1080px] table-fixed">
        <caption className="sr-only">SOS requests from residents</caption>
        <colgroup><col className="w-[132px]" /><col className="w-[205px]" /><col className="w-[185px]" /><col className="w-[175px]" /><col className="w-[142px]" /><col className="w-[120px]" /><col className="w-[126px]" /><col className="w-[132px]" /></colgroup>
        <thead className="portal-table"><tr><th>SOS ID</th><th>Resident</th><th>Barangay / Purok</th><th>Request</th><th>Priority</th><th>Time</th><th>Status</th><th className="data-table__action text-right">Action</th></tr></thead>
        <tbody className="portal-table">
          {visibleRequests.map((request) => <tr className="data-table__row" key={request.id}>
            <td className="font-mono text-[11px] text-indigo-200">{request.id}</td>
            <td><p className="font-semibold text-slate-100">{request.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{request.contact}</p></td>
            <td className="leading-5 text-slate-200">{request.location}</td>
            <td><p className="font-medium text-slate-200">{request.type}</p><p className="mt-1 text-[10px] text-slate-500">{request.category}</p></td>
            <td className="whitespace-nowrap"><StatusPill tone={statusTone(request.priority)}>{request.priority}</StatusPill></td>
            <td className="font-mono text-[10px] text-slate-400">{request.received}</td>
            <td><StatusPill tone={statusTone(request.status)}>{request.status}</StatusPill></td>
            <td className="data-table__action text-right"><button aria-label={`View ${request.id} details`} className="whitespace-nowrap rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-3 py-2 text-[10px] font-semibold text-indigo-200 transition hover:border-indigo-300/45 hover:bg-indigo-500/20 hover:text-white" onClick={() => setTableSelectedId(request.id)} type="button">View details</button></td>
          </tr>)}
          {visibleRequests.length === 0 && <tr><td className="px-5 py-12 text-center text-xs text-slate-500" colSpan={8}>No SOS requests match the current search or status filter.</td></tr>}
        </tbody>
      </TableFrame>
      {selectedRequest && <SosRequestDetailDialog onClose={closeDetail} onUpdateStatus={onUpdateStatus} request={selectedRequest} />}
    </div>
  )
}
