import { Minus, Plus, Satellite } from 'lucide-react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import './BasemapToggle.css'

export type BasemapKey = 'map' | 'satellite'

interface BasemapToggleProps {
  onChange: (basemap: BasemapKey) => void
  value: BasemapKey
}

export function BasemapToggle({ onChange, value }: BasemapToggleProps) {
  return (
    <div aria-label="Basemap" className="basemap-toggle">
      <button aria-pressed={value === 'map'} className={`basemap-toggle__option${value === 'map' ? ' is-active' : ''}`} onClick={() => onChange('map')} type="button">Map</button>
      <button aria-pressed={value === 'satellite'} className={`basemap-toggle__option${value === 'satellite' ? ' is-active' : ''}`} onClick={() => onChange('satellite')} type="button"><Satellite />Satellite</button>
    </div>
  )
}

interface MapZoomControlsProps {
  map: MapLibreMap | null
  ready: boolean
}

export function MapZoomControls({ map, ready }: MapZoomControlsProps) {
  const adjustZoom = (amount: 1 | -1) => {
    if (!map || !ready) return
    const nextZoom = Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), map.getZoom() + amount))
    map.easeTo({ duration: 200, zoom: nextZoom })
  }

  return <div aria-label="Map zoom controls" className="map-zoom"><button aria-label="Zoom in" className="map-zoom__button map-zoom__button--split" disabled={!ready} onClick={() => adjustZoom(1)} type="button"><Plus /></button><button aria-label="Zoom out" className="map-zoom__button" disabled={!ready} onClick={() => adjustZoom(-1)} type="button"><Minus /></button></div>
}
