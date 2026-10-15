import { CompactSelect } from "./CompactSelect"
import { barangayKey, barangayOptions } from "../data/barangays"
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { Building2, Maximize2, Minimize2, Save, UserPlus, X } from 'lucide-react'
import { environment } from '../config/environment'
import { BasemapToggle, type BasemapKey } from './BasemapToggle'
import { createRasterStyle, toLngLat, toLngLatBounds } from '../utils/maplibre'
import type { MapPosition } from '../data/evacuationCenters'
import type { CenterInput, LiveCenter, Place, Setup } from '../types/evacuation'
import './AddEvacuationCenterDialog.css'

// Covers the full Pitogo/CPG island area while keeping the picker focused on the municipality.
const pitogoIslandBounds: [MapPosition, MapPosition] = [[10.015, 124.455], [10.175, 124.665]]
const islandOverviewZoom = 11
const minimumCenterMapZoom = 10
const basemaps: Record<BasemapKey, { attribution: string; url: string }> = {
  map: { attribution: environment.map.streetAttribution, url: environment.map.streetTileUrl },
  satellite: { attribution: environment.map.attribution, url: environment.map.tileUrl },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span className="field__label">{label}</span><span className="field-control">{children}</span></label>
}

function LocationPickerMap({ expanded, label, location, onExpandedChange, onPick }: { expanded: boolean; label: string; location: MapPosition; onExpandedChange: (expanded: boolean) => void; onPick: (position: MapPosition) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const markerLabelRef = useRef<HTMLSpanElement | null>(null)
  const onPickRef = useRef(onPick)
  const locationRef = useRef(location)
  const [basemap, setBasemap] = useState<BasemapKey>('map')
  const [isReady, setIsReady] = useState(false)
  const activeBasemapRef = useRef<BasemapKey>('map')

  useEffect(() => { onPickRef.current = onPick }, [onPick])
  useEffect(() => { locationRef.current = location }, [location])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = new maplibregl.Map({
      attributionControl: false,
      center: toLngLat(locationRef.current),
      container,
      doubleClickZoom: true,
      dragPan: true,
      keyboard: true,
      maxBounds: toLngLatBounds(pitogoIslandBounds),
      maxZoom: environment.map.maxZoom,
      minZoom: minimumCenterMapZoom,
      scrollZoom: true,
      style: createRasterStyle(environment.map.streetTileUrl, environment.map.streetAttribution, environment.map.maxZoom),
      touchZoomRotate: true,
      zoom: islandOverviewZoom,
    })
    mapRef.current = map
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(container)
    map.on('load', () => {
      const element = document.createElement('span')
      element.className = 'islasafe-location-marker'
      const pin = document.createElement('span')
      pin.className = 'islasafe-location-marker__pin'
      const markerLabel = document.createElement('span')
      markerLabel.className = 'islasafe-location-marker__label'
      markerLabelRef.current = markerLabel
      element.append(pin, markerLabel)
      const updateLocation = (position: MapPosition) => {
        markerRef.current?.setLngLat(toLngLat(position))
        onPickRef.current(position)
      }
      markerRef.current = new maplibregl.Marker({ anchor: 'center', draggable: true, element }).setLngLat(toLngLat(locationRef.current)).addTo(map)
      markerRef.current.on('dragend', () => {
        const position = markerRef.current?.getLngLat()
        if (position) updateLocation([position.lat, position.lng])
      })
      map.on('click', (event) => updateLocation([event.lngLat.lat, event.lngLat.lng]))
      setIsReady(true)
      window.requestAnimationFrame(() => map.resize())
    })
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      markerLabelRef.current = null
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isReady || activeBasemapRef.current === basemap) return
    activeBasemapRef.current = basemap
    const selectedBasemap = basemaps[basemap]
    map.setStyle(createRasterStyle(selectedBasemap.url, selectedBasemap.attribution, environment.map.maxZoom), { diff: false })
    map.once('style.load', () => {
      map.resize()
      map.triggerRepaint()
    })
  }, [basemap, isReady])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || !isReady) return
    if (markerLabelRef.current) markerLabelRef.current.textContent = label
    marker.setLngLat(toLngLat(location))
  }, [isReady, label, location])

  return <div aria-label="Evacuation center location picker" className="add-center__picker" role="application"><div className="islasafe-map add-center__picker-canvas" ref={containerRef} /><BasemapToggle onChange={setBasemap} value={basemap} /><button aria-label={expanded ? 'Minimize map' : 'Expand map'} className="add-center__expand" onClick={() => onExpandedChange(!expanded)} type="button">{expanded ? <Minimize2 /> : <Maximize2 />}</button></div>
}

type DialogProps = {
  onClose: () => void
  onSave: (center: CenterInput) => Promise<void>
  onCreatePlace: (barangay: string) => Promise<Place>
  setup: Setup
  center?: LiveCenter
}

export function AddEvacuationCenterDialog({ onClose, onSave, onCreatePlace, setup, center }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const saveLock = useRef(false)
  const [name, setName] = useState(center?.name ?? '')
  const [placeId, setPlaceId] = useState(String(center?.place.id ?? ''))
  const [newBarangay, setNewBarangay] = useState('')
  const [managerId, setManagerId] = useState('')
  const [showManagers, setShowManagers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [capacity, setCapacity] = useState(String(center?.capacity ?? ''))
  const [status, setStatus] = useState(center?.status ?? 'Operational')
  const [contact, setContact] = useState(center?.contact ?? '')
  const [location, setLocation] = useState<MapPosition>([center?.latitude ?? 10.109, center?.longitude ?? 124.562])
  const [locationPicked, setLocationPicked] = useState(center?.latitude != null && center?.longitude != null)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const assigned = setup.assignments.filter((item) => item.center_id === center?.id)
  const markerLabel = name.trim() || 'New evacuation center'

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.showModal()
    return () => { document.body.style.overflow = overflow; previous?.focus() }
  }, [])

  const saveCenter = async () => {
    if (saveLock.current) return
    if (!name.trim()) { setError('Enter an evacuation center name.'); return }
    if (!placeId || (placeId === 'new' && !newBarangay.trim())) { setError('Select or enter the barangay.'); return }
    if (!locationPicked) { setError('Select the exact facility location on the map.'); return }
    if (!Number.isFinite(location[0]) || !Number.isFinite(location[1]) || Math.abs(location[0]) > 90 || Math.abs(location[1]) > 180) { setError('Enter valid latitude and longitude coordinates.'); return }
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1 || Number(capacity) > 100000) { setError('Maximum capacity must be a whole number from 1 to 100,000.'); return }
    const managerAssignment = setup.assignments.find((assignment) => assignment.user_id === Number(managerId))
    if (managerId && (!setup.managers.some((manager) => manager.id === Number(managerId)) || (managerAssignment && managerAssignment.center_id !== center?.id))) { setError('This camp manager is no longer available for this center. Choose an available manager.'); return }
    saveLock.current = true
    setSaving(true); setError('')
    try {
      const place = placeId === 'new' ? await onCreatePlace(newBarangay.trim()) : null
      // Keep the created barangay selected if saving the center fails.
      if (place) setPlaceId(String(place.id))
      await onSave({ name: name.trim(), place_id: place?.id ?? Number(placeId), capacity: Number(capacity), latitude: location[0], longitude: location[1], status, contact: contact.trim() || null, camp_manager_id: managerId ? Number(managerId) : null })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save center.') }
    finally { saveLock.current = false; setSaving(false) }
  }

  return <dialog ref={dialogRef} aria-labelledby="add-center-title" className="modal modal--form add-center-dialog" onCancel={(event) => { event.preventDefault(); if (!saving) onClose() }}>
    <div className="modal-header modal-header--form">
      <div className="add-center__heading"><span className="add-center__heading-icon"><Building2 /></span><div><h2 id="add-center-title">{center ? 'Edit evacuation center' : 'Add evacuation center'}</h2><p className="modal-header__subtitle">A place of safety, visible to your community.</p></div></div>
      <button aria-label="Close evacuation center form" className="modal-close modal-close--form" disabled={saving} onClick={onClose} type="button"><X /></button>
    </div>
    <form onSubmit={(event) => { event.preventDefault(); void saveCenter() }}>
      {error && <p className="fp-error add-center__error" role="alert">{error}</p>}
      <fieldset disabled={saving} className="add-center__fieldset">
        <div className="add-center__form">
          <div className="stack-4">
            <p className="add-center__section-label">FACILITY DETAILS</p>
            <Field label="Evacuation center name *"><input autoFocus maxLength={180} onChange={(event) => setName(event.target.value)} placeholder="e.g. Pitogo Barangay Hall" required value={name} /></Field>
            <CompactSelect searchable label="Barangay *" value={placeId === 'new' ? 'create:' + newBarangay : placeId} disabled={saving}
              options={[{ value: '', label: 'Select barangay' }, ...setup.places.map((place) => ({ value: String(place.id), label: `${place.barangay} - ${place.municipality}` })), ...barangayOptions.filter((item) => !setup.places.some((place) => place.municipality === 'President Carlos P. Garcia' && barangayKey(place.barangay) === barangayKey(item.value))).map((item) => ({ value: 'create:' + item.value, label: item.label }))]}
              onChange={(value) => { if (value.startsWith('create:')) { setPlaceId('new'); setNewBarangay(value.slice(7)); } else { setPlaceId(value); setNewBarangay(''); } }} />
            <Field label="Maximum capacity *"><input min="1" max="100000" step="1" onChange={(event) => setCapacity(event.target.value)} placeholder="Number of evacuees" required type="number" value={capacity} /></Field>
            <div className="add-center__assignment">
              {assigned.length > 0 && <p className="add-center__hint">Assigned: {assigned.map((item) => item.user.name).join(', ')}</p>}
              <button className="action-button add-center__assign" aria-expanded={showManagers} onClick={() => setShowManagers(!showManagers)} type="button"><UserPlus className="action-button__icon" />Assign camp manager</button>
              {showManagers && <CompactSelect searchable label="Camp manager" value={managerId} disabled={saving} onChange={setManagerId} options={[{ value: '', label: assigned.length ? 'Keep current assignments' : 'Assign later' }, ...setup.managers.map((manager) => { const assignment = setup.assignments.find((item) => item.user_id === manager.id); return { value: String(manager.id), label: manager.name + (assignment ? ` - ${assignment.center.name}` : ''), disabled: Boolean(assignment && assignment.center_id !== center?.id) } })]} />}
              {showManagers && <p className="add-center__hint">{setup.managers.length ? 'Available managers can register evacuees from this barangay. Managers assigned elsewhere are unavailable.' : 'No camp manager accounts yet. You can save this center and assign a manager later.'}</p>}
            </div>
            {center && <><CompactSelect label="Status" value={status} disabled={saving} onChange={setStatus} options={[{ value: "Operational", label: "Operational" }, { value: "Closed", label: "Deactivated (closed)" }, { value: "Unavailable", label: "Temporarily unavailable" }]} /><p className="add-center__hint">Deactivated centers are hidden from residents. Transfer or check out occupants first.</p></>}
            <Field label="Contact (optional)"><input maxLength={120} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Facility contact number" /></Field>
          </div>
          <div className="stack-4">
            <div><div className="add-center__picker-header"><span className="add-center__section-label">MAP LOCATION *</span><span className="add-center__picker-hint">Click the map or drag the pin</span></div>
              <div className={`add-center__map${isMapExpanded ? ' add-center__map--expanded' : ''}`}><LocationPickerMap expanded={isMapExpanded} label={markerLabel} location={location} onExpandedChange={setIsMapExpanded} onPick={(position) => { if (!saving) { setLocation(position); setLocationPicked(true) } }} /></div>
            </div>
            <div className="add-center__hint add-center__sync-note"><Building2 size={18} /><span>Saved centers appear on the admin map and sync to residents automatically. Fields marked * are required.</span></div>
          </div>
        </div>
      </fieldset>
      <div className="add-center__footer"><button className="action-button" disabled={saving} onClick={onClose} type="button">Cancel</button><button className="action-button-primary" disabled={saving} type="submit"><Save className="action-button__icon" />{saving ? 'Saving evacuation center...' : 'Save Evacuation Center'}</button></div>
    </form>
  </dialog>
}
