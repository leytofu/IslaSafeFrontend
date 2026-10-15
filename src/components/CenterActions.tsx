import { useEffect, useRef, useState } from 'react'
import { Power, Trash2, X } from 'lucide-react'
import { apiFetch } from '../utils/api'
import type { LiveCenter } from '../types/evacuation'

type Action = 'deactivate' | 'reactivate' | 'delete'
export function CenterActions({ center, token, onChanged }: { center: LiveCenter; token: string; onChanged: (message: string) => Promise<void> }) {
  const [action, setAction] = useState<Action | null>(null)
  return <>
    <button className="action-button" type="button" disabled={center.current > 0 && center.status === 'Operational'} title={center.current > 0 ? 'Check out or transfer occupants before deactivating.' : undefined}
      aria-label={`${center.status === 'Operational' ? 'Deactivate' : 'Reactivate'} ${center.name}`} onClick={() => setAction(center.status === 'Operational' ? 'deactivate' : 'reactivate')}><Power className="action-button__icon" />{center.status === 'Operational' ? 'Deactivate' : 'Reactivate'}</button>
    <button className="action-button evac-delete-button" type="button" disabled={center.current > 0} title={center.current > 0 ? 'Check out or transfer occupants before deleting.' : undefined} aria-label={'Delete ' + center.name} onClick={() => setAction('delete')}><Trash2 className="action-button__icon" />Delete</button>
    {action && <CenterActionConfirmation key={action} center={center} token={token} action={action} onClose={() => setAction(null)} onChanged={onChanged} />}
  </>
}
function CenterActionConfirmation({ center, token, action, onClose, onChanged }: { center: LiveCenter; token: string; action: Action; onClose: () => void; onChanged: (message: string) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const title = action === 'delete' ? 'Delete center' : action === 'deactivate' ? 'Deactivate center' : 'Reactivate center'
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    return () => previous?.focus()
  }, [])
  async function confirm() {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try {
      await apiFetch(`/admin/evacuation/centers/${center.id}`, { token, method: action === 'delete' ? 'DELETE' : 'PATCH', ...(action === 'delete' ? {} : { body: { status: action === 'deactivate' ? 'Closed' : 'Operational' } }) })
      const message = action === 'delete' ? 'Evacuation center deleted.' : action === 'deactivate' ? 'Evacuation center deactivated.' : 'Evacuation center reactivated.'
      await onChanged(message)
      onClose()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update this center.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <dialog ref={dialog} className="modal evac-action-dialog" aria-labelledby="center-action-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="modal-header"><h2 id="center-action-title">{title}</h2><button className="modal-close" aria-label="Close center action" disabled={busy} onClick={onClose} type="button"><X /></button></div>
    <div className="evac-action-body"><strong>{center.name}</strong>
      <p>{action === 'delete' ? 'Permanently remove this unused center from the directory and map. Assigned Camp Manager accounts will be retained and become available for reassignment.' : action === 'deactivate' ? 'Hide this center from resident maps and stop new check-ins. Existing evacuation history and Camp Manager assignments will be retained.' : 'Make this center operational and visible on resident maps again.'}</p>
      {action === 'delete' && <p>Centers with evacuation history cannot be deleted. Deactivate them instead.</p>}
      {error && <p role="alert" className="fp-error">{error}</p>}
      <div className="evac-action-footer"><button className="action-button" disabled={busy} onClick={onClose} type="button">Cancel</button><button className={action === 'delete' ? 'action-button-primary evac-delete-confirm' : 'action-button-primary'} disabled={busy} onClick={() => void confirm()} type="button">{busy ? 'Saving...' : title}</button></div>
    </div>
  </dialog>
}
