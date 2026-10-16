import { useEffect, useState } from 'react'
import { ArrowUpRight, ChevronRight, Inbox, Megaphone, X } from 'lucide-react'
import type { SosCategory, SosRequest } from '../data/sosRequests'
import { AdvisoryDetail } from './AdvisoryDetail'
import { advisoryDate, type AdvisoryRecord } from '../data/advisoryRecords'
import type { useAdvisories } from '../hooks/useAdvisories'
import './ResponsePanels.css'

const sosCategories: Array<'All' | SosCategory> = ['All', 'Medical', 'Flood assistance', 'Evacuation']

function PanelHeader({ title, link, onClick }: { title: string; link: string; onClick?: () => void }) {
  return <div className="panel-header"><h2>{title}</h2><button aria-label={`${link} ${title}`} className="panel-header__link" onClick={onClick} type="button">{link}<ArrowUpRight /></button></div>
}

function SosRequestRow({ request, onSelect }: { request: SosRequest; onSelect: (id: string) => void }) {
  const Icon = request.icon
  return <button className="sos-row" onClick={() => onSelect(request.id)} type="button"><span className={`sos-tile sos-tile--sm ${request.color}`}><Icon /></span><span className="sos-row__body"><span className="sos-row__name">{request.name}</span><span className="sos-row__location">{request.location} &middot; {request.type}</span><span className="sos-row__time">{request.received}</span></span><ChevronRight className="sos-row__chevron" /></button>
}

function AllSosRequestsDialog({ requests, onClose, onSelectRequest }: { requests: SosRequest[]; onClose: () => void; onSelectRequest: (id: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | SosCategory>('All')
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape) }, [onClose])

  return <div className="modal-overlay" onMouseDown={onClose}><section aria-describedby="all-sos-description" aria-labelledby="all-sos-title" aria-modal="true" className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog"><header className="modal-header"><div className="modal-header__title-block"><p className="modal-eyebrow">SOS monitoring</p><h2 id="all-sos-title">All recent SOS requests</h2><p className="modal-header__detail" id="all-sos-description">{requests.length} requests, organized by assistance type.</p></div><button aria-label="Close all recent SOS requests" autoFocus className="modal-close" onClick={onClose} type="button"><X /></button></header><div className="modal-body stack-5"><div aria-label="Filter SOS requests by category" className="chip-group" role="group">{sosCategories.map((category) => <button aria-pressed={selectedCategory === category} className={`dialog-filter${selectedCategory === category ? ' is-active' : ''}`} key={category} onClick={() => setSelectedCategory(category)} type="button">{category}</button>)}</div>{sosCategories.filter((category): category is SosCategory => category !== 'All' && (selectedCategory === 'All' || category === selectedCategory)).map((category) => { const categoryRequests = requests.filter((request) => request.category === category); return <section key={category}><div className="dialog-group__header"><h3 className="dialog-group__title">{category}</h3><span className="dialog-group__count">{categoryRequests.length}</span></div><div className="stack-1.5">{categoryRequests.map((request) => <SosRequestRow key={request.id} onSelect={onSelectRequest} request={request} />)}</div></section> })}</div></section></div>
}

interface ResponsePanelsProps {
  requests: SosRequest[]
  advisories: ReturnType<typeof useAdvisories>
  onOpenAdvisories: () => void
  onOpenSosRequest: (id: string) => void
}

export function ResponsePanels({ requests, onOpenSosRequest, advisories, onOpenAdvisories }: ResponsePanelsProps) {
  const [isAllSosOpen, setIsAllSosOpen] = useState(false)
  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryRecord | null>(null)
  const recentSosRequests = requests.filter((request) => request.period === 'today')
  return <div className="response-panels stack-5"><section className="response-panel panel"><PanelHeader link="View all" onClick={() => setIsAllSosOpen(true)} title="Recent SOS requests" /><div aria-live="polite" className="stack-1">{recentSosRequests.length > 0 ? recentSosRequests.map((request) => <SosRequestRow key={request.id} onSelect={onOpenSosRequest} request={request} />) : <div className="sos-empty"><Inbox /><p>No recent SOS requests found.</p></div>}</div></section><section className="response-panel panel"><PanelHeader link="View all" onClick={onOpenAdvisories} title="Active advisories" /><div className="stack-2.5">{advisories.error && <p role="alert">{advisories.error} <button className="action-button" onClick={advisories.reload}>Retry</button></p>}{!advisories.loaded ? <p role="status">Loading advisories...</p> : !advisories.error && advisories.active.length === 0 ? <div className="sos-empty"><Megaphone /><p>No active advisories.</p></div> : null}{advisories.active.slice(0, 3).map((advisory) => <button className={`advisory-card advisory-card--${advisory.priority.toLowerCase()}`} key={advisory.id} onClick={() => setSelectedAdvisory(advisory)} type="button"><span className="advisory-card__title"><Megaphone /> {advisory.title}</span><span className="advisory-card__meta">{advisory.priority} &middot; {advisoryDate(advisory.published_at)} (PH)</span></button>)}</div></section>{isAllSosOpen && <AllSosRequestsDialog onClose={() => setIsAllSosOpen(false)} onSelectRequest={onOpenSosRequest} requests={requests} />}{selectedAdvisory && <AdvisoryDetail advisory={selectedAdvisory} onClose={() => setSelectedAdvisory(null)} onManage={onOpenAdvisories} />}</div>
}
