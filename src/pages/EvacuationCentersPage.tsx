import { CenterActions } from "../components/CenterActions"
import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, RefreshCw } from 'lucide-react'
import { AddEvacuationCenterDialog } from '../components/AddEvacuationCenterDialog'
import { LiveEvacuationCenterCard } from '../components/LiveEvacuationCenterCard'
import { EvacuationCenterDetail } from '../components/EvacuationCenterDetail'
import { SearchField } from '../components/SearchField'
import { SectionHeading } from '../components/Primitives'
import { useEvacuationCenters } from '../hooks/useEvacuationCenters'
import { apiFetch } from '../utils/api'
import type { CenterInput, LiveCenter, Place, Setup } from '../types/evacuation'
import './EvacuationCentersPage.css'

export function EvacuationCentersPage({ sessionKey, initialCenterId = null, onClearInitial }: { sessionKey: string; initialCenterId?: number | null; onClearInitial?: () => void }) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<LiveCenter | 'new' | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const selectedId = selected ?? initialCenterId
  const [setup, setSetup] = useState<Setup | null>(null)
  const [setupError, setSetupError] = useState('')
  const [notice, setNotice] = useState('')
  const { centers, loading, error, connection, revision, refresh } = useEvacuationCenters(sessionKey, query)
  const loadSetup = useCallback(async () => {
    try { const { data } = await apiFetch<{ data: Setup }>('/admin/evacuation/setup', { sessionKey }); setSetup(data); setSetupError('') }
    catch (caught) { setSetupError(caught instanceof Error ? caught.message : 'Unable to load barangays and managers.') }
  }, [sessionKey])
  useEffect(() => { const timer = setTimeout(() => void loadSetup(), 0); return () => clearTimeout(timer) }, [loadSetup])
  const changed = async () => { window.dispatchEvent(new Event('evacuation-centers-changed')); await refresh() }
  const saveCenter = async (body: CenterInput) => {
    const id = editing && editing !== 'new' ? editing.id : null
    await apiFetch(`/admin/evacuation/centers${id ? `/${id}` : ''}`, { sessionKey, method: id ? 'PATCH' : 'POST', body })
    setEditing(null); setNotice(id ? 'Evacuation center updated.' : 'Evacuation center saved and added to the map.')
    if (!id) setQuery('')
    await changed(); void loadSetup()
  }
  const createPlace = async (barangay: string) => {
    const { data } = await apiFetch<{ data: Place }>('/admin/evacuation/places', { sessionKey, method: 'POST', body: { barangay, municipality: 'President Carlos P. Garcia' } })
    setSetup((current) => current ? { ...current, places: [...current.places.filter((place) => place.id !== data.id), data] } : current)
    return data
  }
  return <div className="page stack-5">
    <div className="evac-toolbar"><SearchField onChange={setQuery} placeholder="Search evacuation centers..." value={query} /><div className="evac-toolbar"><button className="action-button" type="button" onClick={() => { void changed(); void loadSetup() }}><RefreshCw className="action-button__icon" />Refresh</button><button className="action-button-primary" disabled={!setup} onClick={() => { setEditing('new'); void loadSetup() }} type="button"><Plus className="action-button__icon" />Add Center</button></div></div>
    {setupError && <p role="alert" className="fp-error">{setupError} <button type="button" className="auth-link" onClick={() => void loadSetup()}>Retry setup</button></p>}
    {notice && <p role="status">{notice}</p>}
    <SectionHeading title="Evacuation Centers" detail="Select a center to view its registered evacuees by age category and gender." />
    <p className="evac-live-event" aria-live="polite">{connection} - Reconciles every 15 seconds</p>
    {error && <p role="alert" className="fp-error">{error}</p>}
    {loading ? <p>Loading evacuation centers...</p> : centers.length === 0 && !error ? <section className="panel panel--pad-5"><h2>{query ? 'No centers match your search' : 'No evacuation centers recorded'}</h2><p>Add a facility and mark its location to get started.</p></section> : <div className="evac-grid evac-directory-scroll" role="region" tabIndex={0} aria-label="Evacuation center directory">{centers.map((center) => <div className="evac-directory-item" key={center.id}><LiveEvacuationCenterCard center={center} onSelect={() => setSelected(center.id)} /><div className="evac-card-actions"><button className="action-button" type="button" disabled={!setup} onClick={() => { setEditing(center); void loadSetup() }}><Pencil className="action-button__icon" />Edit</button><CenterActions center={center} sessionKey={sessionKey} onChanged={async (message) => { setNotice(message); await Promise.all([changed(), loadSetup()]) }} /></div></div>)}</div>}
    {editing && setup && <AddEvacuationCenterDialog setup={setup} center={editing === 'new' ? undefined : editing} onCreatePlace={createPlace} onClose={() => setEditing(null)} onSave={saveCenter} />}
    {selectedId !== null && <EvacuationCenterDetail key={selectedId} id={selectedId} sessionKey={sessionKey} revision={revision} onClose={() => { setSelected(null); onClearInitial?.() }} onChange={changed} />}
  </div>
}
