import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { HeaderResult } from '../types/header'

export function HeaderResidentDialog({ resident, onClose }: { resident: HeaderResult; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const node = dialog.current
    node?.showModal()
    return () => { node?.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="modal header-resident-dialog" aria-labelledby="header-resident-name" onCancel={(event) => { event.preventDefault(); onClose() }}><div className="header-popover__heading"><div><p className="header-result__kind">Resident account #{resident.id}</p><h2 id="header-resident-name">{resident.title}</h2></div><button className="table-icon-button" aria-label="Close resident details" onClick={onClose} type="button"><X /></button></div><dl className="header-resident-dialog__details">{resident.details?.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl><div className="header-resident-dialog__footer"><button className="action-button" onClick={onClose} type="button">Close</button></div></dialog>
}
