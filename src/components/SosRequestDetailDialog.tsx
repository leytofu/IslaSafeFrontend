import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { AlignLeft, Clock3, Flag, MapPin, Phone, UserRound, X } from 'lucide-react'
import { environment } from '../config/environment'
import { BasemapToggle, MapZoomControls, type BasemapKey } from './BasemapToggle'
import { createRasterStyle, setGeoJsonData, toLngLat, updateRasterTiles } from '../utils/maplibre'
import type { SosRequest, SosStatus } from '../data/sosRequests'

const basemapTiles: Record<BasemapKey, string> = {
  map: environment.map.streetTileUrl,
  satellite: environment.map.tileUrl,
}
const minimumMiniMapZoom = 11

interface SosRequestDetailDialogProps {
  request: SosRequest
  onClose: () => void
  onUpdateStatus: (id: string, status: SosStatus) => void
}

function priorityClasses(priority: SosRequest['priority']) {
  if (priority === 'Critical') return 'border-rose-400/30 bg-rose-500/15 text-rose-100'
  if (priority === 'High') return 'border-amber-400/30 bg-amber-400/15 text-amber-100'
  return 'border-indigo-400/30 bg-indigo-500/15 text-indigo-100'
}

function statusClasses(status: SosStatus) {
  if (status === 'Resolved') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
  if (status === 'Coming') return 'border-sky-400/30 bg-sky-400/10 text-sky-100'
  return 'border-rose-400/30 bg-rose-500/10 text-rose-100'
}

function SosLocationMap({ request }: { request: SosRequest }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [basemap, setBasemap] = useState<BasemapKey>('map')
  const [isReady, setIsReady] = useState(false)
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = new maplibregl.Map({
      attributionControl: false,
      center: toLngLat(request.coordinates),
      container,
      doubleClickZoom: true,
      dragPan: true,
      keyboard: true,
      maxZoom: environment.map.maxZoom,
      minZoom: minimumMiniMapZoom,
      scrollZoom: true,
      style: createRasterStyle(environment.map.streetTileUrl, environment.map.streetAttribution, environment.map.maxZoom),
      touchZoomRotate: true,
      zoom: 16,
    })
    mapRef.current = map
    setMapInstance(map)
    setIsReady(false)
    let locationLabel: maplibregl.Marker | undefined

    map.on('load', () => {
      setGeoJsonData(map, 'sos-location', {
        features: [{ geometry: { coordinates: [request.coordinates[1], request.coordinates[0]], type: 'Point' }, properties: {}, type: 'Feature' }],
        type: 'FeatureCollection',
      })
      map.addLayer({
        id: 'sos-location-marker', source: 'sos-location', type: 'circle',
        paint: { 'circle-color': '#f43f5e', 'circle-opacity': 1, 'circle-radius': 9, 'circle-stroke-color': '#fff1f2', 'circle-stroke-width': 2 },
      } as maplibregl.CircleLayerSpecification)
      const element = document.createElement('span')
      element.className = 'islasafe-map-label islasafe-map-label--pin'
      element.textContent = request.location
      locationLabel = new maplibregl.Marker({ anchor: 'bottom', element, offset: [0, -12] }).setLngLat(toLngLat(request.coordinates)).addTo(map)
      setIsReady(true)
      window.requestAnimationFrame(() => map.resize())
    })

    return () => {
      locationLabel?.remove()
      map.remove()
      mapRef.current = null
      setMapInstance(null)
    }
  }, [request])

  useEffect(() => {
    const map = mapRef.current
    if (map && isReady) updateRasterTiles(map, basemapTiles[basemap])
  }, [basemap, isReady])

  return <div aria-label={`Map location for ${request.location}`} className="relative h-44 w-full" role="application"><div className="islasafe-map h-full w-full" ref={containerRef} /><BasemapToggle onChange={setBasemap} value={basemap} /><MapZoomControls map={mapInstance} ready={isReady} /></div>
}

export function SosRequestDetailDialog({ request, onClose, onUpdateStatus }: SosRequestDetailDialogProps) {
  const Icon = request.icon
  const isResolved = request.status === 'Resolved'

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section aria-describedby="sos-detail-description" aria-labelledby="sos-detail-title" aria-modal="true" className="flex h-[620px] w-[680px] max-h-[calc(100svh-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1222] shadow-2xl shadow-black/70" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <header className="relative shrink-0 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_88%_0%,rgba(99,102,241,0.24),transparent_42%),linear-gradient(135deg,rgba(30,41,59,0.95),rgba(11,18,34,0.98))] px-5 py-4 sm:px-6">
          <div className="absolute -right-7 -top-8 size-28 rounded-full border border-indigo-300/10 bg-indigo-400/5" />
          <div className="relative flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-[10px] font-semibold tracking-[0.13em] text-indigo-200">{request.id}</p><span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${statusClasses(request.status)}`}>{request.status}</span></div><h2 className="mt-2 font-display text-lg font-semibold text-white" id="sos-detail-title">SOS request details</h2><p className="mt-1 text-xs text-slate-400" id="sos-detail-description">Review the request, verify its location, and coordinate a response.</p></div><button aria-label="Close SOS request details" autoFocus className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={onClose} type="button"><X className="size-4" /></button></div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <section className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${request.color}`}><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-white">{request.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><Phone className="size-3.5" /> {request.contact}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${priorityClasses(request.priority)}`}>{request.priority} priority</span></div></div></section>

          <section className="overflow-hidden rounded-xl border border-white/10"><div className="flex items-center justify-between border-b border-white/8 bg-white/[0.025] px-3.5 py-2.5"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300"><MapPin className="size-4 text-indigo-300" /> Exact location</h3><span className="font-mono text-[9px] text-slate-500">GIS position</span></div><SosLocationMap key={request.id} request={request} /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 bg-white/[0.025] px-3.5 py-2.5"><span className="text-xs text-slate-300">{request.location}</span><span className="font-mono text-[9px] text-slate-500">{request.coordinates[0].toFixed(5)} N, {request.coordinates[1].toFixed(5)} E</span></div></section>

          <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"><UserRound className="size-3.5" /> SOS category</p><p className="mt-2 text-xs font-semibold text-slate-100">{request.category}</p><p className="mt-1 text-[10px] text-slate-500">{request.type}</p></div><div className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"><Clock3 className="size-3.5" /> Time received</p><p className="mt-2 text-xs font-semibold text-slate-100">{request.received}</p></div></section>

          <section className="rounded-xl border border-white/8 bg-white/[0.025] p-4"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300"><AlignLeft className="size-4 text-indigo-300" /> Description</h3><p className="mt-3 text-xs leading-5 text-slate-300">{request.description}</p></section>
        </div>

        <footer className="flex shrink-0 gap-3 border-t border-white/10 bg-[#0b1222] p-4 sm:px-6"><button className="action-button flex-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={isResolved || request.status === 'Coming'} onClick={() => onUpdateStatus(request.id, 'Coming')} type="button"><Flag className="size-3.5" /> {request.status === 'Coming' ? 'Response coming' : 'Coming'}</button><button className="action-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={isResolved} onClick={() => onUpdateStatus(request.id, 'Resolved')} type="button">{isResolved ? 'Resolved' : 'Resolve'}</button></footer>
      </section>
    </div>
  )
}
