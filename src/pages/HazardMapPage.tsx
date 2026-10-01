import { useState } from 'react'
import { Check, ChevronRight, CircleHelp, LocateFixed, MapPin, Maximize2, Plus, RefreshCw, Route, TriangleAlert } from 'lucide-react'
import { LiveMap } from '../components/LiveMap'
import { mapLayers, urbanHazards, type MapLayerKey, type UrbanHazard } from '../data/mapLayers'
import { Panel, SectionHeading, StatusPill } from '../components/Primitives'

const zones = [
  { name: 'Storm surge watch', barangay: 'Lapinig', level: 'Critical', details: '87 residents in coastal watch zone', color: 'bg-rose-500' },
  { name: 'Flood-risk zone', barangay: 'Pitogo', level: 'Moderate', details: '212 residents / 54 households', color: 'bg-amber-400' },
  { name: 'Landslide risk', barangay: 'Baud', level: 'High', details: 'Access road under assessment', color: 'bg-violet-400' },
]

const alerts = [
  { title: 'Typhoon advisory', detail: 'Signal No. 2 remains active', time: '6 min ago', tone: 'danger' as const },
  { title: 'Weather station', detail: 'Rainfall at 42 mm/hr', time: '12 min ago', tone: 'warning' as const },
  { title: 'Response coordination', detail: '4 teams on field deployment', time: '19 min ago', tone: 'info' as const },
]

function ControlLabel({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>{children}</label>
}

function LayerToggle({ color, enabled, label, onToggle }: { color: string; enabled: boolean; label: string; onToggle: () => void }) {
  return <button aria-pressed={enabled} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs transition ${enabled ? 'bg-white/[0.055] text-slate-100' : 'text-slate-500 hover:bg-white/[0.035] hover:text-slate-300'}`} onClick={onToggle} type="button"><span className={`grid size-4 place-items-center rounded border transition ${enabled ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-white/20 bg-white/5 text-transparent'}`}><Check className="size-3" /></span><span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} /><span className="flex-1">{label}</span></button>
}

interface HazardMapPageProps {
  mapOnly?: boolean
  onMapOnlyChange?: (mapOnly: boolean) => void
}

export function HazardMapPage({ mapOnly = false, onMapOnlyChange }: HazardMapPageProps) {
  const [visibleLayers, setVisibleLayers] = useState<MapLayerKey[]>([])
  const [barangay, setBarangay] = useState('All barangays')
  const [urbanHazard, setUrbanHazard] = useState<UrbanHazard>('Flooding')
  const [selectedFeature, setSelectedFeature] = useState('Click a marker, route, or exposure area to inspect its current status.')
  const exposure = urbanHazards.find((hazard) => hazard.key === urbanHazard) ?? urbanHazards[0]
  const toggleLayer = (layer: MapLayerKey) => setVisibleLayers((current) => current.includes(layer) ? current.filter((key) => key !== layer) : [...current, layer])
  const refresh = () => setSelectedFeature('Map data refreshed — all visible operational layers are current.')

  if (mapOnly) {
    return (
      <main aria-label="Full CPG map view" className="h-screen bg-[#07101d]">
        <LiveMap barangay={barangay === 'All CPG barangays' ? 'All barangays' : barangay} full fullScreen onFeatureSelect={setSelectedFeature} onMinimize={() => onMapOnlyChange?.(false)} urbanHazard={urbanHazard} visibleLayers={visibleLayers} />
      </main>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_310px]">
        <Panel className="p-4 sm:p-5">
          <SectionHeading detail="Choose an exposure map, focus a barangay, then select a colored item for more information." title="CPG hazard map" action={<div className="flex shrink-0 gap-2"><button className="action-button" onClick={refresh} type="button"><RefreshCw className="size-3.5" /> Refresh</button><button className="action-button" onClick={() => onMapOnlyChange?.(true)} type="button"><Maximize2 className="size-3.5" /> Full map view</button><button className="action-button-primary" type="button"><Plus className="size-3.5" /> Add zone</button></div>} />

          <section aria-label="Map controls" className="mb-4 grid gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
            <ControlLabel label="Focus area"><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" /><select className="h-10 w-full rounded-lg border border-white/10 bg-[#0d1424] pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-indigo-400/50" onChange={(event) => setBarangay(event.target.value)} value={barangay}><option>All CPG barangays</option><option>Pitogo</option><option>Lapinig</option><option>Baud</option><option>San Vicente</option></select></span></ControlLabel>
            <ControlLabel label="Urban exposure map"><span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 size-2.5 -translate-y-1/2 rounded-sm" style={{ backgroundColor: exposure.color }} /><select className="h-10 w-full rounded-lg border border-white/10 bg-[#0d1424] pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-indigo-400/50" onChange={(event) => setUrbanHazard(event.target.value as UrbanHazard)} value={urbanHazard}>{urbanHazards.map((hazard) => <option key={hazard.key}>{hazard.key}</option>)}</select></span></ControlLabel>
            <div className="flex items-end gap-2"><button className="action-button h-10 w-full" onClick={() => setBarangay('All barangays')} type="button"><Route className="size-3.5" /> Reset view</button></div>
          </section>

          <LiveMap barangay={barangay === 'All CPG barangays' ? 'All barangays' : barangay} full onFeatureSelect={setSelectedFeature} urbanHazard={urbanHazard} visibleLayers={visibleLayers} />

          <section aria-live="polite" className="mt-4 flex items-start gap-3 rounded-xl border border-indigo-400/15 bg-indigo-500/[0.07] p-3.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-400/15 text-indigo-200"><LocateFixed className="size-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-300">Selected map item</p><p className="mt-1 text-xs leading-5 text-indigo-100">{selectedFeature}</p></div></section>

          <section className="mt-4 rounded-xl border border-white/8 bg-white/[0.025] p-4"><SectionHeading detail="Recent field updates entered by responders." title="Operational updates" /><div className="grid gap-2 sm:grid-cols-3">{[['Safe route cleared', 'Pitogo', '8 min ago', 'success'], ['Blocked route', 'Baud', '14 min ago', 'warning'], ['Coastal warning sign', 'Lapinig', '20 min ago', 'danger']].map(([title, location, added, tone]) => <div className="rounded-lg border border-white/8 bg-[#0b1120]/55 px-3 py-3" key={title}><p className="text-xs font-semibold text-slate-100">{title}</p><p className="mt-1 text-[10px] text-slate-500">{location} · {added}</p><span className="mt-2 inline-block"><StatusPill tone={tone as 'success' | 'warning' | 'danger'}>{tone === 'success' ? 'Verified' : tone === 'warning' ? 'Assessing' : 'Active'}</StatusPill></span></div>)}</div></section>
        </Panel>

        <aside className="space-y-5">
          <Panel className="p-4"><SectionHeading detail="Turn layers on only when they help your current response task." title="Map layers" /><div className="space-y-1">{mapLayers.map((layer) => <LayerToggle color={layer.color} enabled={visibleLayers.includes(layer.key)} key={layer.key} label={layer.label} onToggle={() => toggleLayer(layer.key)} />)}</div></Panel>
          <Panel className="p-4"><SectionHeading title="Current exposure" /><div className="rounded-xl border border-white/8 bg-white/[0.03] p-3"><div className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: exposure.color }} /><span className="text-xs font-semibold text-slate-100">{urbanHazard}</span></div><p className="mt-2 text-[11px] leading-4 text-slate-400">{exposure.detail}. Turn on Hazard zones to show this operational overlay; verify conditions on the ground before action.</p></div></Panel>
          <Panel className="p-4"><SectionHeading title="Priority alerts" />{alerts.map((alert) => <div className="border-b border-white/8 py-3 first:pt-0 last:border-0 last:pb-0" key={alert.title}><div className="flex gap-2.5"><TriangleAlert className={`mt-0.5 size-4 shrink-0 ${alert.tone === 'danger' ? 'text-rose-400' : alert.tone === 'warning' ? 'text-amber-300' : 'text-indigo-300'}`} /><div className="min-w-0"><p className="text-xs font-semibold text-slate-100">{alert.title}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{alert.detail}</p><p className="mt-1 font-mono text-[9px] text-slate-600">{alert.time}</p></div></div></div>)}</Panel>
          <Panel className="p-4"><SectionHeading title="Mapped hazard zones" />{zones.map((zone) => <button className="flex w-full items-start gap-3 rounded-lg border-b border-white/8 py-3 text-left transition first:pt-0 last:border-0 last:pb-0 hover:bg-white/[0.035]" key={zone.name} onClick={() => { setBarangay(zone.barangay); setSelectedFeature(`${zone.name} — ${zone.details}`) }} type="button"><span className={`mt-1 size-2.5 shrink-0 rounded-full ${zone.color}`} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-100">{zone.name}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{zone.barangay} · {zone.details}</span></span><span className="flex items-center gap-1"><StatusPill tone={zone.level === 'Critical' ? 'danger' : 'warning'}>{zone.level}</StatusPill><ChevronRight className="mt-0.5 size-3.5 text-slate-600" /></span></button>)}</Panel>
          <div className="flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 text-[10px] leading-4 text-slate-500"><CircleHelp className="mt-0.5 size-3.5 shrink-0 text-slate-400" /> Use the layer list to reduce clutter; hover or select an item directly on the map to inspect it.</div>
        </aside>
      </div>
    </div>
  )
}
