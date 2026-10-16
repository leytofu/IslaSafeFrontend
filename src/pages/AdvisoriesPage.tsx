import { useRef, useState, type FormEvent } from 'react'
import { ChevronRight } from 'lucide-react'
import { FilterButton, Panel, SectionHeading, StatusPill, TableFrame } from '../components/Primitives'
import { statusTone } from '../utils/statusTone'
import { advisoryDate, type AdvisoryRecord } from '../data/advisoryRecords'
import { useAdvisories } from '../hooks/useAdvisories'
import { apiFetch } from '../utils/api'
import { barangayKey, barangayOptions } from '../data/barangays'
import './AdvisoriesPage.css'

function AdvisoryForm({ item, sessionKey, onSaved, onCancel }: { item: AdvisoryRecord | null; sessionKey: string; onSaved: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const initialTarget = item?.target === 'All barangays' || !item ? 'All barangays' : barangayOptions.find(option => barangayKey(option.value) === barangayKey(item.target))?.value ?? ''
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current) return
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(['title', 'message', 'priority', 'target', 'status'].map(key => [key, String(form.get(key) ?? '').trim()]))
    lock.current = true; setBusy(true); setError('')
    try {
      await apiFetch(`/admin/advisories${item ? `/${item.id}` : ''}`, { sessionKey, method: item ? 'PATCH' : 'POST', body })
      onSaved()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save advisory.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <Panel className="advisory-form panel--pad-5">
    <SectionHeading detail="Create and manage notices shown on the dashboard." title={item ? `Edit advisory ADV-${item.id}` : 'New advisory'} />
    <form onSubmit={event => void save(event)}>
      <fieldset className="advisory-fields stack-4" disabled={busy}>
        <label className="field"><span className="field__label" id="advisory-title-label">Title</span><span className="field-control"><input autoFocus={!!item} name="title" aria-labelledby="advisory-title-label" required maxLength={200} defaultValue={item?.title ?? ''} /></span></label>
        <label className="field"><span className="field__label" id="advisory-priority-label">Priority</span><span className="field-control"><select name="priority" aria-labelledby="advisory-priority-label" defaultValue={item?.priority ?? 'Info'}>{['Critical', 'Warning', 'Info'].map(value => <option key={value}>{value}</option>)}</select></span></label>
        <label className="field"><span className="field__label" id="advisory-target-label">Target area</span><span className="field-control"><select name="target" aria-labelledby="advisory-target-label" aria-describedby="advisory-target-help" required defaultValue={initialTarget}>{!initialTarget && <option value="" disabled>Select a barangay</option>}<option value="All barangays">All barangays</option>{barangayOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></span></label>
        <p id="advisory-target-help" className="advisory-detail-meta">All barangays notifies all resident and camp manager accounts in their mobile inbox. A specific barangay limits the audience to that area.</p>
        <label className="field"><span className="field__label" id="advisory-message-label">Message</span><span className="field-control"><textarea name="message" aria-labelledby="advisory-message-label" required maxLength={5000} rows={6} defaultValue={item?.message ?? ''} /></span></label>
        {item ? <label className="field"><span className="field__label" id="advisory-status-label">Status</span><span className="field-control"><select name="status" aria-labelledby="advisory-status-label" defaultValue={item.status}><option>Active</option><option>Archived</option></select></span></label> : <input name="status" type="hidden" value="Active" />}
        {error && <p role="alert">{error}</p>}
        <button className="action-button-primary action-button-primary--block" type="submit">{busy ? 'Saving…' : item ? 'Save advisory' : 'Publish advisory'}</button>
        {item && <button className="action-button" onClick={onCancel} type="button">Cancel editing</button>}
      </fieldset>
    </form>
  </Panel>
}

export function AdvisoriesPage({ sessionKey }: { sessionKey: string }) {
  const { items, error, loaded, reload } = useAdvisories(sessionKey)
  const [filter, setFilter] = useState('All')
  const [status, setStatus] = useState('Active')
  const [selected, setSelected] = useState<AdvisoryRecord | null>(null)
  const [generation, setGeneration] = useState(0)
  const [notice, setNotice] = useState('')
  const visible = items.filter(item => (filter === 'All' || item.priority === filter) && (status === 'All' || item.status === status))
  return <div className="advisories-layout">
    <div className="stack-4">
      <div className="chip-group" aria-label="Filter by priority">{['All', 'Critical', 'Warning', 'Info'].map(item => <FilterButton active={filter === item} key={item} onClick={() => setFilter(item)}>{item}</FilterButton>)}</div>
      <label className="field"><span className="field__label" id="advisories-status-label">Advisory status</span><select className="evac-filter" aria-labelledby="advisories-status-label" value={status} onChange={event => setStatus(event.target.value)}><option>Active</option><option>Archived</option><option>All</option></select></label>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error} <button className="action-button" onClick={reload}>Retry</button></p>}
      {!loaded ? <p role="status">Loading advisories…</p> : <TableFrame>
        <thead className="portal-table"><tr><th>ID</th><th>Title</th><th>Target area</th><th>Published (PH)</th><th>Priority</th><th>Status</th><th /></tr></thead>
        <tbody className="portal-table">{visible.map(item => <tr key={item.id}><td className="cell-id">ADV-{item.id}</td><td className="cell-primary">{item.title}</td><td>{item.target}</td><td className="cell-sub">{advisoryDate(item.published_at)}</td><td><StatusPill tone={statusTone(item.priority)}>{item.priority}</StatusPill></td><td>{item.status}</td><td><button aria-label={`Edit ${item.title}`} className="table-icon-button" type="button" onClick={() => { setSelected(item); setNotice('') }}><ChevronRight /></button></td></tr>)}{visible.length === 0 && <tr><td colSpan={7}>No advisories match these filters.</td></tr>}</tbody>
      </TableFrame>}
    </div>
    <AdvisoryForm key={`${selected?.id ?? 'new'}-${generation}`} item={selected} sessionKey={sessionKey} onCancel={() => setSelected(null)} onSaved={() => { setNotice(selected ? 'Advisory updated.' : 'Advisory published.'); setSelected(null); setGeneration(value => value + 1); reload() }} />
  </div>
}
