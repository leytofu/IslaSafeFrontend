import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { advisoryDate, type AdvisoryRecord } from '../data/advisoryRecords'
import './IncidentDialog.css'
import '../pages/AdvisoriesPage.css'

export function AdvisoryDetail({ advisory, onClose, onManage }: { advisory: AdvisoryRecord; onClose: () => void; onManage: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const node = ref.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    node?.showModal()
    return () => { node?.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  return <dialog ref={ref} className="modal incident-dialog" aria-labelledby="advisory-detail-title" onCancel={onClose}>
    <header className="incident-dialog__heading"><h2 id="advisory-detail-title">{advisory.title}</h2><button className="table-icon-button" aria-label="Close advisory details" onClick={onClose}><X /></button></header>
    <p className="advisory-detail-meta">{advisory.priority} · {advisory.target} · {advisory.status}</p>
    <p className="advisory-detail-message">{advisory.message}</p>
    <p className="advisory-detail-meta">Published {advisoryDate(advisory.published_at)} (Philippine time)</p>
    <div className="incident-dialog__footer"><button className="action-button-primary" onClick={onManage}>Manage advisories</button></div>
  </dialog>
}
