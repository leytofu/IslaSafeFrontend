import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { AlignLeft, Clock3, Flag, MapPin, Phone, UserRound, X } from 'lucide-react'
import { environment } from '../config/environment'
import { BasemapToggle, MapZoomControls, type BasemapKey } from './BasemapToggle'
import { createRasterStyle, setGeoJsonData, toLngLat, updateRasterTiles } from '../utils/maplibre'
import type { SosRequest, SosStatus } from '../data/sosRequests'
import './SosRequestDetailDialog.css'

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

function priorityTone(priority: SosRequest['priority']) {
  if (priority === 'Critical') return 'critical'
  if (priority === 'High') return 'high'
  return 'medium'
}

function statusToneModifier(status: SosStatus) {
  if (status === 'Resolved') return 'resolved'
  if (status === 'Coming') return 'coming'
  return 'pending'
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

  return <div aria-label={`Map location for ${request.location}`} className="sos-detail__map" role="application"><div className="islasafe-map sos-detail__map-canvas" ref={containerRef} /><BasemapToggle onChange={setBasemap} value={basemap} /><MapZoomControls map={mapInstance} ready={isReady} /></div>
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
    <div className="modal-overlay modal-overlay--detail" onMouseDown={onClose}>
      <section aria-describedby="sos-detail-description" aria-labelledby="sos-detail-title" aria-modal="true" className="modal modal--detail" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <header className="modal-header sos-detail__header">
          <div className="sos-detail__header-orb" />
          <div className="sos-detail__header-content"><div className="sos-detail__identity"><div className="sos-detail__badges"><p className="sos-detail__id">{request.id}</p><span className={`sos-detail__status sos-detail__status--${statusToneModifier(request.status)}`}>{request.status}</span></div><h2 className="sos-detail__title" id="sos-detail-title">SOS request details</h2><p className="modal-header__detail" id="sos-detail-description">Review the request, verify its location, and coordinate a response.</p></div><button aria-label="Close SOS request details" autoFocus className="modal-close modal-close--detail" onClick={onClose} type="button"><X /></button></div>
        </header>

        <div className="modal-body stack-4">
          <section className="sos-detail__request"><span className={`sos-tile sos-tile--lg ${request.color}`}><Icon /></span><div className="sos-detail__request-body"><div className="sos-detail__request-row"><div><h3 className="sos-detail__request-name">{request.name}</h3><p className="sos-detail__request-contact"><Phone /> {request.contact}</p></div><span className={`sos-detail__priority sos-detail__priority--${priorityTone(request.priority)}`}>{request.priority} priority</span></div></div></section>

          <section className="sos-detail__location"><div className="sos-detail__location-header"><h3 className="sos-detail__box-title"><MapPin /> Exact location</h3><span className="sos-detail__location-gis">GIS position</span></div><SosLocationMap key={request.id} request={request} /><div className="sos-detail__location-footer"><span className="sos-detail__location-name">{request.location}</span><span className="sos-detail__location-coords">{request.coordinates[0].toFixed(5)} N, {request.coordinates[1].toFixed(5)} E</span></div></section>

          <section className="sos-detail__facts"><div className="sos-detail__fact"><p className="sos-detail__fact-label"><UserRound /> SOS category</p><p className="sos-detail__fact-value">{request.category}</p><p className="sos-detail__fact-hint">{request.type}</p></div><div className="sos-detail__fact"><p className="sos-detail__fact-label"><Clock3 /> Time received</p><p className="sos-detail__fact-value">{request.received}</p></div></section>

          <section className="sos-detail__description"><h3 className="sos-detail__box-title"><AlignLeft /> Description</h3><p className="sos-detail__description-text">{request.description}</p></section>
        </div>

        <footer className="sos-detail__footer"><button className="action-button action-button--grow" disabled={isResolved || request.status === 'Coming'} onClick={() => onUpdateStatus(request.id, 'Coming')} type="button"><Flag className="action-button__icon" /> {request.status === 'Coming' ? 'Response coming' : 'Coming'}</button><button className="action-button-primary action-button--grow" disabled={isResolved} onClick={() => onUpdateStatus(request.id, 'Resolved')} type="button">{isResolved ? 'Resolved' : 'Resolve'}</button></footer>
      </section>
    </div>
  )
}
