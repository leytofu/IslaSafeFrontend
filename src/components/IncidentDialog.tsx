import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { incidentSeverities, incidentStatuses, incidentTypes, type Incident } from '../types/incidents'
import './IncidentDialog.css'

function localDateTime(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function IncidentDialog({ incident, sessionKey, onClose, onSaved }: { incident: Incident | null; sessionKey: string; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const node = dialog.current
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    node?.showModal()
    return () => { node?.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (lock.current) return
    const form = new FormData(event.currentTarget)
    const reported = new Date(String(form.get('reported_at')))
    if (!Number.isFinite(reported.getTime()) || reported > new Date()) { setError('Reported time must be a valid date in the past or present.'); return }
    const body = {
      type: form.get('type'), location: String(form.get('location')).trim(), severity: form.get('severity'), status: form.get('status'),
      affected: String(form.get('affected')).trim() || null, description: String(form.get('description')).trim() || null,
      reported_at: reported.toISOString(),
    }
    lock.current = true; setBusy(true); setError('')
    try {
      await apiFetch(`/admin/incidents${incident ? `/${incident.id}` : ''}`, { sessionKey, method: incident ? 'PATCH' : 'POST', body })
      onSaved()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save this incident.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <dialog className="modal incident-dialog" ref={dialog} aria-labelledby="incident-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="incident-dialog__heading"><h2 id="incident-dialog-title">{incident ? `Edit incident INC-${String(incident.id).padStart(4, '0')}` : 'Log incident'}</h2><button aria-label="Close incident form" className="table-icon-button" disabled={busy} onClick={onClose} type="button"><X /></button></div>
    <form onSubmit={(event) => void submit(event)} aria-busy={busy}>
      <fieldset className="incident-dialog__fields" disabled={busy}>
        <label className="field"><span className="field__label" id="incident-type-label">Incident type</span><select aria-labelledby="incident-type-label" className="evac-filter" name="type" defaultValue={incident?.type ?? 'Typhoon'} required>{incidentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="field"><span className="field__label">Location</span><input className="evac-filter" name="location" defaultValue={incident?.location ?? ''} required maxLength={255} placeholder="Barangay or specific location" /></label>
        <label className="field"><span className="field__label" id="incident-severity-label">Severity</span><select aria-labelledby="incident-severity-label" className="evac-filter" name="severity" defaultValue={incident?.severity ?? 'Moderate'} required>{incidentSeverities.map((severity) => <option key={severity}>{severity}</option>)}</select></label>
        <label className="field"><span className="field__label" id="incident-status-label">Status</span><select aria-labelledby="incident-status-label" className="evac-filter" name="status" defaultValue={incident?.status ?? 'Active'} required>{incidentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field"><span className="field__label">Reported at (your local time)</span><input className="evac-filter" name="reported_at" type="datetime-local" defaultValue={localDateTime(incident ? new Date(incident.reported_at) : new Date())} required max={localDateTime(new Date())} /></label>
        <label className="field"><span className="field__label">Affected people or facilities (optional)</span><input className="evac-filter" name="affected" defaultValue={incident?.affected ?? ''} maxLength={255} placeholder="e.g. 12 households or road closed" /></label>
        <label className="field incident-dialog__description"><span className="field__label">Description (optional)</span><textarea className="evac-filter" name="description" defaultValue={incident?.description ?? ''} rows={3} maxLength={2000} /></label>
      </fieldset>
      {error && <p className="incident-dialog__error" role="alert">{error}</p>}
      <div className="incident-dialog__footer"><button className="action-button" onClick={onClose} type="button" disabled={busy}>Cancel</button><button className="action-button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save incident'}</button></div>
    </form>
  </dialog>
}
