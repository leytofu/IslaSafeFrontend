import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '../utils/api'
import type { LiveCenter } from '../types/evacuation'
import { GroupedEvacuees } from './GroupedEvacuees'
const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
export function EvacuationCenterDetail({ id, token, revision, onClose, onChange }: { id: number; token: string; revision: number; onClose: () => void; onChange: () => Promise<void> }) {
  const [center, setCenter] = useState<LiveCenter | null>(null)
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const load = useCallback(() => apiFetch<{ data: LiveCenter }>(`/admin/evacuation/centers/${id}`, { token }), [id, token])
  useEffect(() => { dialog.current?.showModal() }, [])
  useEffect(() => { let active = true; void load().then(({ data }) => { if (active) { setCenter(data); setError('') } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load center.') }); return () => { active = false } }, [load, revision])
  const changed = async () => { setCenter((await load()).data); setError(''); await onChange() }
  async function updateCenter(form: HTMLFormElement) {
    if (lock.current) return
    lock.current = true
    const values = new FormData(form)
    setBusy(true); setError('')
    try {
      await apiFetch(`/admin/evacuation/centers/${id}`, { token, method: 'PATCH', body: { capacity: values.get('capacity') === '' ? null : Number(values.get('capacity')), status: values.get('status'), contact: values.get('contact') || null } })
      await changed()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update center.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <dialog ref={dialog} className="modal evac-detail" aria-labelledby="evac-detail-title" onCancel={(event) => { event.preventDefault(); onClose() }}>
    <div className="modal-header"><div><h2 id="evac-detail-title">{center?.name ?? 'Loading center...'}</h2>{center && <p className="evac-live-event">{center.place.barangay} - {center.place.municipality}</p>}</div><button className="modal-close" aria-label="Close center details" onClick={onClose} type="button"><X /></button></div>
    {error && <p role="alert" className="fp-error">{error} <button className="auth-link" type="button" onClick={() => void changed().catch((caught) => setError(caught.message))}>Retry</button></p>}
    {center && <>
      <div className="evac-detail-metrics"><span>Registered: <strong>{center.registered}</strong></span><span>Checked in: <strong>{center.current}</strong></span><span>Available spaces: <strong>{center.available ?? 'Unknown'}</strong></span><span>First-time: <strong>{center.first_time}</strong></span><span>Returning: <strong>{center.returning}</strong></span></div>
      <GroupedEvacuees id={id} token={token} revision={revision} places={center.demographics?.places.map((item) => item.place) ?? []} onChange={changed} />
      <details className="evac-center-settings"><summary>Center settings & occupancy demographics</summary>
        <form className="evac-toolbar" onSubmit={(event) => { event.preventDefault(); void updateCenter(event.currentTarget) }}><label className="field">Maximum capacity<input className="evac-filter" name="capacity" required type="number" min="1" max="100000" placeholder="Not configured" defaultValue={center.capacity ?? ''} /></label><label className="field">Operational status<select className="evac-filter" name="status" defaultValue={center.status}>{['Operational', 'Closed', 'Unavailable'].map((status) => <option key={status}>{status}</option>)}</select></label><label className="field">Contact<input name="contact" className="evac-filter" maxLength={120} defaultValue={center.contact ?? ''} /></label><button className="action-button" disabled={busy} type="submit">Save center settings</button></form>
        <p className="evac-live-event">Demographics count current occupants only. Recorded events: {center.total_recorded_events}.</p>
        <div className="evac-breakdowns">{(['age', 'gender'] as const).map((kind) => <section key={kind}><h3>{label(kind)} breakdown</h3>{Object.entries(center.demographics?.[kind] ?? {}).map(([category, count]) => <div className="evac-breakdown-row" key={category}><span>{label(category)}</span><progress max={Math.max(1, center.current)} value={count} /><strong>{count}</strong></div>)}</section>)}<section><h3>Place of residence</h3>{center.demographics?.places.map((item) => <p key={item.place.id}>{item.place.barangay}: <strong>{item.total}</strong></p>)}<h3>Purok / Sitio</h3>{center.demographics?.puroks.map((item) => <p key={`${item.place.id}-${item.purok}`}>{item.place.barangay} / {item.purok ?? 'Unspecified'}: <strong>{item.total}</strong></p>)}</section></div>
      </details>
    </>}
  </dialog>
}
