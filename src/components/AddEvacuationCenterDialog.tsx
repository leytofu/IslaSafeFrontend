import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { MapPin, Maximize2, Minimize2, Plus, X } from 'lucide-react'
import { environment } from '../config/environment'
import { BasemapToggle, type BasemapKey } from './BasemapToggle'
import { createRasterStyle, toLngLat, toLngLatBounds } from '../utils/maplibre'
import type { EvacuationCenter, MapPosition } from '../data/evacuationCenters'

// Covers the full Pitogo/CPG island area while keeping the picker focused on the municipality.
const pitogoIslandBounds: [MapPosition, MapPosition] = [[10.015, 124.455], [10.175, 124.665]]
const islandOverviewZoom = 11
const minimumCenterMapZoom = 10
const basemaps: Record<BasemapKey, { attribution: string; url: string }> = {
  map: { attribution: environment.map.streetAttribution, url: environment.map.streetTileUrl },
  satellite: { attribution: environment.map.attribution, url: environment.map.tileUrl },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</span><span className="field-control">{children}</span></label>
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

  return <div aria-label="Evacuation center location picker" className="relative h-full w-full" role="application"><div className="islasafe-map islasafe-map--picker h-full w-full" ref={containerRef} /><BasemapToggle onChange={setBasemap} value={basemap} /><button aria-label={expanded ? 'Minimize map' : 'Expand map'} className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg border border-white/15 bg-slate-950/90 text-slate-100 shadow-xl backdrop-blur-md transition hover:bg-indigo-500/70" onClick={() => onExpandedChange(!expanded)} type="button">{expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</button></div>
}

export function AddEvacuationCenterDialog({ onClose, onSave }: { onClose: () => void; onSave: (center: EvacuationCenter) => void }) {
  const [name, setName] = useState('')
  const [barangay, setBarangay] = useState('Pitogo')
  const [capacity, setCapacity] = useState('100')
  const [location, setLocation] = useState<MapPosition>([10.1222, 124.5569])
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const markerLabel = name.trim() || 'New evacuation center'
  const saveCenter = () => { onSave({ name: name.trim(), barangay, capacity: Number(capacity), current: 0, status: 'Operational', contact: 'Contact to be assigned', position: location }) }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"><section aria-modal="true" aria-labelledby="add-center-title" className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/12 bg-[#0b1120] shadow-2xl shadow-black/70" role="dialog"><div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4"><div><h2 className="font-display text-lg font-semibold text-white" id="add-center-title">Add evacuation center</h2><p className="mt-1 text-xs text-slate-500">Enter the center details, then click the map to set its location.</p></div><button aria-label="Close add evacuation center" className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white" onClick={onClose} type="button"><X className="size-4" /></button></div><form onSubmit={(event) => { event.preventDefault(); saveCenter() }}><div className="grid gap-5 p-5 lg:grid-cols-[280px_minmax(0,1fr)]"><div className="space-y-4"><Field label="Center name"><input autoFocus onChange={(event) => setName(event.target.value)} placeholder="e.g. Barangay Hall" required value={name} /></Field><Field label="Barangay"><select onChange={(event) => setBarangay(event.target.value)} value={barangay}><option>Pitogo</option><option>Lapinig</option><option>Baud</option><option>San Vicente</option><option>Aguining</option><option>Tugas</option></select></Field><Field label="Capacity"><input min="1" onChange={(event) => setCapacity(event.target.value)} required type="number" value={capacity} /></Field><div className="rounded-xl border border-indigo-400/15 bg-indigo-500/[0.07] p-3"><p className="flex items-center gap-2 text-xs font-semibold text-indigo-100"><MapPin className="size-4 text-indigo-300" /> Map location selected</p><p className="mt-1.5 font-mono text-[10px] text-indigo-200/70">{location[0].toFixed(5)}, {location[1].toFixed(5)}</p></div></div><div><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-300">Place marker</span><span className="text-[10px] text-slate-500">Click or drag the marker to set the exact location</span></div><div className={`${isMapExpanded ? 'h-[min(56svh,520px)]' : 'h-72'} overflow-hidden rounded-xl border border-white/10 transition-[height] duration-200`}><LocationPickerMap expanded={isMapExpanded} label={markerLabel} location={location} onExpandedChange={setIsMapExpanded} onPick={setLocation} /></div></div></div><div className="flex flex-col-reverse gap-2 border-t border-white/8 px-5 py-4 sm:flex-row sm:justify-end"><button className="action-button" onClick={onClose} type="button">Cancel</button><button className="action-button-primary" type="submit"><Plus className="size-3.5" /> Add center and marker</button></div></form></section></div>
}
