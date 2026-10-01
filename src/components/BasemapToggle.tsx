import { Minus, Plus, Satellite } from 'lucide-react'
import type { Map as MapLibreMap } from 'maplibre-gl'

export type BasemapKey = 'map' | 'satellite'

interface BasemapToggleProps {
  onChange: (basemap: BasemapKey) => void
  value: BasemapKey
}

export function BasemapToggle({ onChange, value }: BasemapToggleProps) {
  return (
    <div aria-label="Basemap" className="absolute left-3 top-3 z-10 inline-flex overflow-hidden rounded-lg border border-white/15 bg-slate-950/90 p-1 shadow-xl backdrop-blur-md">
      <button aria-pressed={value === 'map'} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${value === 'map' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} onClick={() => onChange('map')} type="button">Map</button>
      <button aria-pressed={value === 'satellite'} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${value === 'satellite' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} onClick={() => onChange('satellite')} type="button"><Satellite className="size-3" />Satellite</button>
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

  return <div aria-label="Map zoom controls" className="absolute bottom-3 right-3 z-10 overflow-hidden rounded-lg border border-white/15 bg-slate-950/90 shadow-xl backdrop-blur-md"><button aria-label="Zoom in" className="grid size-8 place-items-center border-b border-white/10 text-slate-100 transition hover:bg-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-50" disabled={!ready} onClick={() => adjustZoom(1)} type="button"><Plus className="size-4" /></button><button aria-label="Zoom out" className="grid size-8 place-items-center text-slate-100 transition hover:bg-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-50" disabled={!ready} onClick={() => adjustZoom(-1)} type="button"><Minus className="size-4" /></button></div>
}
