import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { FeatureCollection, Geometry } from 'geojson'
import { Crosshair, MapPinned, Minimize2 } from 'lucide-react'
import { environment } from '../config/environment'
import { BasemapToggle, type BasemapKey } from './BasemapToggle'
import { createCirclePolygon, createRasterStyle, setGeoJsonData, toLngLat, toLngLatBounds, updateRasterTiles, type MapCoordinate } from '../utils/maplibre'
import { mapLayers, urbanHazards, type MapLayerKey, type UrbanHazard } from '../data/mapLayers'

// President Carlos P. Garcia is centred on Lapinig Island, Bohol.
// These bounds keep the map focused on the municipality instead of the wider province.
const pitogo: MapCoordinate = [10.109, 124.562]
const cpgNavigationBounds: [MapCoordinate, MapCoordinate] = [[10.015, 124.455], [10.175, 124.665]]
const minimumMapZoom = 11
const cpgOverviewZoom = minimumMapZoom + 1
const fullMapMaximumZoom = Math.max(minimumMapZoom, environment.map.maxZoom - 2)
const barangayViews: Record<string, { center: MapCoordinate; zoom: number }> = {
  'All barangays': { center: pitogo, zoom: cpgOverviewZoom },
  Pitogo: { center: [10.1222, 124.5569], zoom: 16 },
  Lapinig: { center: [10.1278, 124.5419], zoom: 16 },
  Baud: { center: [10.103, 124.58], zoom: 16 },
  'San Vicente': { center: [10.116, 124.572], zoom: 16 },
}

const basemaps = {
  map: { attribution: environment.map.streetAttribution, label: 'Map', url: environment.map.streetTileUrl },
  satellite: { attribution: environment.map.attribution, label: 'Satellite', url: environment.map.tileUrl },
} as const

const barangayLabels: Array<{ name: string; position: MapCoordinate }> = [
  { name: 'Butan', position: [10.133, 124.51] }, { name: 'Gaus', position: [10.134, 124.55] },
  { name: 'Lapinig', position: [10.127, 124.53] }, { name: 'Pitogo', position: [10.122, 124.54] },
  { name: 'Tugas', position: [10.136, 124.604] }, { name: 'Lipata', position: [10.13, 124.591] },
  { name: 'Saguise', position: [10.124, 124.573] }, { name: 'Bonbonon', position: [10.121, 124.558] },
  { name: 'Campamanog', position: [10.112, 124.521] }, { name: 'San Vicente', position: [10.11, 124.536] },
  { name: 'San Jose', position: [10.114, 124.546] }, { name: 'Tugnao', position: [10.113, 124.562] },
  { name: 'Bayog', position: [10.108, 124.574] }, { name: 'Santo Rosario', position: [10.113, 124.59] },
  { name: 'Kabangkalan', position: [10.105, 124.602] }, { name: 'Canmangao', position: [10.103, 124.551] },
  { name: 'Villa Milagrosa', position: [10.098, 124.537] }, { name: 'Aguining', position: [10.097, 124.586] },
  { name: 'Bogo', position: [10.08, 124.532] }, { name: 'Basiao', position: [10.072, 124.548] },
  { name: 'Popoo', position: [10.065, 124.54] }, { name: 'Baud', position: [10.062, 124.552] },
  { name: 'Tilmobo', position: [10.113, 124.614] },
]

function emptyCollection(): FeatureCollection<Geometry> {
  return { features: [], type: 'FeatureCollection' }
}

function configureOperationalLayers(map: maplibregl.Map) {
  setGeoJsonData(map, 'hazard-zones', emptyCollection())
  setGeoJsonData(map, 'safe-routes', emptyCollection())
  setGeoJsonData(map, 'operational-points', emptyCollection())
  map.addLayer({ id: 'hazard-fill', source: 'hazard-zones', type: 'fill', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['get', 'opacity'] } } as maplibregl.FillLayerSpecification)
  map.addLayer({ id: 'hazard-outline', source: 'hazard-zones', type: 'line', paint: { 'line-color': ['get', 'color'], 'line-opacity': 0.9, 'line-width': 1.5 } } as maplibregl.LineLayerSpecification)
  map.addLayer({ id: 'safe-route-line', source: 'safe-routes', type: 'line', paint: { 'line-color': '#818cf8', 'line-dasharray': [2, 2.5], 'line-opacity': 0.8, 'line-width': 4 } } as maplibregl.LineLayerSpecification)
  map.addLayer({ id: 'operational-points', source: 'operational-points', type: 'circle', paint: { 'circle-color': ['get', 'color'], 'circle-opacity': 1, 'circle-radius': ['get', 'radius'], 'circle-stroke-color': ['get', 'strokeColor'], 'circle-stroke-width': 2 } } as maplibregl.CircleLayerSpecification)
}

function createMapLabel(map: maplibregl.Map, position: MapCoordinate, label: string) {
  const element = document.createElement('span')
  element.className = 'islasafe-map-label'
  element.textContent = label
  return new maplibregl.Marker({ anchor: 'center', element }).setLngLat(toLngLat(position)).addTo(map)
}

function MapLegend({ activeLayers, hazard, hazardColor }: { activeLayers: MapLayerKey[]; hazard: UrbanHazard; hazardColor: string }) {
  const isVisible = (layer: MapLayerKey) => activeLayers.includes(layer)
  const items = [
    { label: `${hazard} exposure`, color: hazardColor, visible: isVisible('hazards') },
    { label: 'Evacuation center', color: '#22c55e', visible: isVisible('evacuation') },
    { label: 'Active SOS', color: '#f43f5e', visible: isVisible('sos') },
    { label: 'Safe route', color: '#818cf8', visible: isVisible('routes') },
  ].filter((item) => item.visible)
  if (items.length === 0) return null
  return <div className="pointer-events-none absolute bottom-[76px] right-3 z-10 w-44 rounded-xl border border-white/10 bg-slate-950/85 p-3 shadow-xl backdrop-blur-md"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Visible on map</p><div className="space-y-1.5">{items.map((item) => <p className="flex items-center gap-2 text-[10px] text-slate-200" key={item.label}><span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />{item.label}</p>)}</div></div>
}

interface LiveMapProps {
  full?: boolean
  fullScreen?: boolean
  visibleLayers?: MapLayerKey[]
  barangay?: string
  urbanHazard?: UrbanHazard
  onFeatureSelect?: (feature: string) => void
  onMinimize?: () => void
}

export function LiveMap({ full = false, fullScreen = false, visibleLayers = [], barangay = 'All barangays', urbanHazard = 'Flooding', onFeatureSelect, onMinimize }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const labelMarkersRef = useRef<maplibregl.Marker[]>([])
  const featureSelectRef = useRef(onFeatureSelect)
  const [basemap, setBasemap] = useState<BasemapKey>('map')
  const [isReady, setIsReady] = useState(false)
  const active = (layer: MapLayerKey) => visibleLayers.includes(layer)
  const exposure = urbanHazards.find((hazard) => hazard.key === urbanHazard) ?? urbanHazards[0]
  const selectedBasemap = basemaps[basemap]
  const mapContainerClass = fullScreen ? 'h-screen' : `rounded-xl border border-white/10 ${full ? 'h-[600px] min-h-[460px]' : 'h-[370px]'}`
  const mapMaximumZoom = full ? fullMapMaximumZoom : environment.map.maxZoom

  useEffect(() => { featureSelectRef.current = onFeatureSelect }, [onFeatureSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = new maplibregl.Map({ attributionControl: { compact: true }, center: toLngLat(pitogo), container, maxBounds: toLngLatBounds(cpgNavigationBounds), maxZoom: mapMaximumZoom, minZoom: minimumMapZoom, scrollZoom: true, style: createRasterStyle(basemaps.map.url, basemaps.map.attribution, environment.map.maxZoom), zoom: cpgOverviewZoom })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    const tooltip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
    const interactiveLayers = ['hazard-fill', 'safe-route-line', 'operational-points']
    const showTooltip = (event: maplibregl.MapLayerMouseEvent) => {
      const label = event.features?.[0]?.properties?.tooltip
      if (!label) return
      map.getCanvas().style.cursor = 'pointer'
      tooltip.setLngLat(event.lngLat).setText(String(label)).addTo(map)
    }
    const hideTooltip = () => { map.getCanvas().style.cursor = ''; tooltip.remove() }
    const selectFeature = (event: maplibregl.MapLayerMouseEvent) => {
      const label = event.features?.[0]?.properties?.label
      if (label) featureSelectRef.current?.(String(label))
    }
    map.on('load', () => {
      configureOperationalLayers(map)
      interactiveLayers.forEach((layerId) => {
        map.on('click', layerId, selectFeature)
        map.on('mouseenter', layerId, showTooltip)
        map.on('mouseleave', layerId, hideTooltip)
      })
      setIsReady(true)
      window.requestAnimationFrame(() => map.resize())
    })
    return () => {
      labelMarkersRef.current.forEach((marker) => marker.remove())
      labelMarkersRef.current = []
      tooltip.remove()
      map.remove()
      mapRef.current = null
    }
  }, [mapMaximumZoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isReady) return
    updateRasterTiles(map, selectedBasemap.url)
  }, [isReady, selectedBasemap.url])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isReady) return
    const view = barangayViews[barangay] ?? barangayViews['All barangays']
    map.stop()
    map.jumpTo({ center: toLngLat(view.center), zoom: view.zoom })
  }, [barangay, isReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isReady) return
    const hazardFeatures = visibleLayers.includes('hazards') ? [
      { geometry: { coordinates: [createCirclePolygon([10.1222, 124.5569], 680)], type: 'Polygon' as const }, properties: { color: exposure.color, label: `${urbanHazard} exposure · Pitogo`, opacity: 0.18, tooltip: `${urbanHazard} exposure · Pitogo` }, type: 'Feature' as const },
      { geometry: { coordinates: [createCirclePolygon([10.1278, 124.5419], 420)], type: 'Polygon' as const }, properties: { color: exposure.color, label: `${urbanHazard} exposure · Lapinig`, opacity: 0.16, tooltip: `${urbanHazard} exposure · Lapinig` }, type: 'Feature' as const },
      { geometry: { coordinates: [createCirclePolygon([10.103, 124.58], 350)], type: 'Polygon' as const }, properties: { color: exposure.color, label: `${urbanHazard} exposure · Aguining`, opacity: 0.16, tooltip: `${urbanHazard} exposure · Aguining` }, type: 'Feature' as const },
    ] : []
    const routeFeatures = visibleLayers.includes('routes') ? [{ geometry: { coordinates: [[124.5569, 10.1222], [124.55, 10.125], [124.5419, 10.1278]], type: 'LineString' as const }, properties: { label: 'Safe response route · Pitogo to Lapinig', tooltip: 'Safe response route' }, type: 'Feature' as const }] : []
    const operationalFeatures = [
      ...(visibleLayers.includes('evacuation') ? [
        { geometry: { coordinates: [124.5569, 10.1222], type: 'Point' as const }, properties: { color: '#22c55e', label: 'Pitogo Central School · Operational', radius: 8, strokeColor: '#dbeafe', tooltip: 'Pitogo Central School · operational' }, type: 'Feature' as const },
        { geometry: { coordinates: [124.572, 10.116], type: 'Point' as const }, properties: { color: '#22c55e', label: 'San Vicente Elementary · Operational', radius: 8, strokeColor: '#dbeafe', tooltip: 'San Vicente Elementary · operational' }, type: 'Feature' as const },
        { geometry: { coordinates: [124.58, 10.103], type: 'Point' as const }, properties: { color: '#f59e0b', label: 'Baud Barangay Hall · Near capacity', radius: 8, strokeColor: '#fef3c7', tooltip: 'Baud Barangay Hall · near capacity' }, type: 'Feature' as const },
      ] : []),
      ...(visibleLayers.includes('sos') ? [
        { geometry: { coordinates: [124.561, 10.118], type: 'Point' as const }, properties: { color: '#f43f5e', label: 'Active SOS · Purok 2, Pitogo', radius: 8, strokeColor: '#fff1f2', tooltip: 'Active SOS · Purok 2, Pitogo' }, type: 'Feature' as const },
        { geometry: { coordinates: [124.545, 10.126], type: 'Point' as const }, properties: { color: '#f43f5e', label: 'Active SOS · Lapinig coast', radius: 8, strokeColor: '#fff1f2', tooltip: 'Active SOS · Lapinig coast' }, type: 'Feature' as const },
      ] : []),
      ...(visibleLayers.includes('edits') ? [{ geometry: { coordinates: [124.578, 10.108], type: 'Point' as const }, properties: { color: '#f59e0b', label: 'Blocked route · assessment needed', radius: 7, strokeColor: '#fef3c7', tooltip: 'Blocked route · assessment needed' }, type: 'Feature' as const }] : []),
    ]
    setGeoJsonData(map, 'hazard-zones', { features: hazardFeatures, type: 'FeatureCollection' })
    setGeoJsonData(map, 'safe-routes', { features: routeFeatures, type: 'FeatureCollection' })
    setGeoJsonData(map, 'operational-points', { features: operationalFeatures, type: 'FeatureCollection' })
  }, [exposure.color, isReady, urbanHazard, visibleLayers])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isReady) return
    labelMarkersRef.current.forEach((marker) => marker.remove())
    labelMarkersRef.current = full && visibleLayers.includes('barangays') ? barangayLabels.map(({ name, position }) => createMapLabel(map, position, name)) : []
  }, [full, isReady, visibleLayers])

  return <div className={`relative overflow-hidden bg-[#07101d] ${mapContainerClass}`}>
    <div aria-label="Interactive CPG hazard map" className="islasafe-map h-full w-full" ref={containerRef} role="application" />
    <BasemapToggle onChange={setBasemap} value={basemap} />
    {!full && visibleLayers.length > 0 && <div className="pointer-events-none absolute left-3 top-14 z-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 shadow-xl backdrop-blur-md"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Map layers</p><div className="space-y-1 text-[10px] text-slate-300">{mapLayers.filter((layer) => active(layer.key)).map((layer) => <p className="flex items-center gap-2" key={layer.key}><span className="size-2 rounded-sm" style={{ backgroundColor: layer.color }} /> {layer.label}</p>)}</div></div>}
    {full && <MapLegend activeLayers={visibleLayers} hazard={urbanHazard} hazardColor={exposure.color} />}
    {fullScreen && onMinimize && <button className="absolute left-3 top-14 z-10 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-slate-100 shadow-xl backdrop-blur-md transition hover:bg-white/10" onClick={onMinimize} type="button"><Minimize2 className="size-3.5" /> Minimize</button>}
    <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-slate-950/80 px-2.5 py-2 font-mono text-[10px] text-emerald-300 shadow-xl backdrop-blur-md"><span className="relative size-2 rounded-full bg-emerald-400 before:absolute before:-inset-1 before:animate-ping before:rounded-full before:bg-emerald-400/60" />LIVE DATA</div>
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-xs text-slate-300 shadow-xl backdrop-blur-md">{full ? <MapPinned className="size-4 text-indigo-300" /> : <Crosshair className="size-4 text-indigo-300" />}{full ? 'CPG island · 23 barangays monitored' : 'CPG island overview'}</div>
  </div>
}
