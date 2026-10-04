import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { MapPin, Maximize2, Minimize2, Plus, X } from 'lucide-react'
import { environment } from '../config/environment'
import { BasemapToggle, type BasemapKey } from './BasemapToggle'
import { createRasterStyle, toLngLat, toLngLatBounds } from '../utils/maplibre'
import type { EvacuationCenter, MapPosition } from '../data/evacuationCenters'
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
      center: toLngLat([10.109, 124.562]),
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
      markerRef.current = new maplibregl.Marker({ anchor: 'bottom', draggable: true, element }).setLngLat(toLngLat(locationRef.current)).addTo(map)
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

export function AddEvacuationCenterDialog({ onClose, onSave }: { onClose: () => void; onSave: (center: EvacuationCenter) => void }) {
  const [name, setName] = useState('')
  const [barangay, setBarangay] = useState('Pitogo')
  const [capacity, setCapacity] = useState('100')
  const [location, setLocation] = useState<MapPosition>([10.1222, 124.5569])
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const markerLabel = name.trim() || 'New evacuation center'
  const saveCenter = () => { onSave({ name: name.trim(), barangay, capacity: Number(capacity), current: 0, status: 'Operational', contact: 'Contact to be assigned', position: location }) }

  return <div className="modal-overlay modal-overlay--form"><section aria-modal="true" aria-labelledby="add-center-title" className="modal modal--form" role="dialog"><div className="modal-header modal-header--form"><div><h2 id="add-center-title">Add evacuation center</h2><p className="modal-header__subtitle">Enter the center details, then click the map to set its location.</p></div><button aria-label="Close add evacuation center" className="modal-close modal-close--form" onClick={onClose} type="button"><X /></button></div><form onSubmit={(event) => { event.preventDefault(); saveCenter() }}><div className="add-center__form"><div className="stack-4"><Field label="Center name"><input autoFocus onChange={(event) => setName(event.target.value)} placeholder="e.g. Barangay Hall" required value={name} /></Field><Field label="Barangay"><select onChange={(event) => setBarangay(event.target.value)} value={barangay}><option>Pitogo</option><option>Lapinig</option><option>Baud</option><option>San Vicente</option><option>Aguining</option><option>Tugas</option></select></Field><Field label="Capacity"><input min="1" onChange={(event) => setCapacity(event.target.value)} required type="number" value={capacity} /></Field><div className="add-center__coords"><p className="add-center__coords-label"><MapPin /> Map location selected</p><p className="add-center__coords-value">{location[0].toFixed(5)}, {location[1].toFixed(5)}</p></div></div><div><div className="add-center__picker-header"><span className="add-center__picker-title">Place marker</span><span className="add-center__picker-hint">Click or drag the marker to set the exact location</span></div><div className={`add-center__map${isMapExpanded ? ' add-center__map--expanded' : ''}`}><LocationPickerMap expanded={isMapExpanded} label={markerLabel} location={location} onExpandedChange={setIsMapExpanded} onPick={setLocation} /></div></div></div><div className="add-center__footer"><button className="action-button" onClick={onClose} type="button">Cancel</button><button className="action-button-primary" type="submit"><Plus className="action-button__icon" /> Add center and marker</button></div></form></section></div>
}
