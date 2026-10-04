import { useState } from 'react'
import { Check, ChevronRight, CircleHelp, LocateFixed, MapPin, Maximize2, Plus, RefreshCw, Route, TriangleAlert } from 'lucide-react'
import { LiveMap } from '../components/LiveMap'
import { mapLayers, urbanHazards, type MapLayerKey, type UrbanHazard } from '../data/mapLayers'
import { Panel, SectionHeading, StatusPill } from '../components/Primitives'
import './HazardMapPage.css'

const zones = [
  { name: 'Storm surge watch', barangay: 'Lapinig', level: 'Critical', details: '87 residents in coastal watch zone', tone: 'critical' },
  { name: 'Flood-risk zone', barangay: 'Pitogo', level: 'Moderate', details: '212 residents / 54 households', tone: 'moderate' },
  { name: 'Landslide risk', barangay: 'Baud', level: 'High', details: 'Access road under assessment', tone: 'high' },
]

const alerts = [
  { title: 'Typhoon advisory', detail: 'Signal No. 2 remains active', time: '6 min ago', tone: 'danger' as const },
  { title: 'Weather station', detail: 'Rainfall at 42 mm/hr', time: '12 min ago', tone: 'warning' as const },
  { title: 'Response coordination', detail: '4 teams on field deployment', time: '19 min ago', tone: 'info' as const },
]

function ControlLabel({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="field"><span className="field__label field__label--micro">{label}</span>{children}</label>
}

function LayerToggle({ color, enabled, label, onToggle }: { color: string; enabled: boolean; label: string; onToggle: () => void }) {
  return <button aria-pressed={enabled} className={`hazard-layer${enabled ? ' is-on' : ''}`} onClick={onToggle} type="button"><span className={`hazard-layer__check${enabled ? ' is-on' : ''}`}><Check /></span><span className="hazard-layer__dot" style={{ backgroundColor: color }} /><span className="hazard-layer__label">{label}</span></button>
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
      <main aria-label="Full CPG map view" className="hazard-map-only">
        <LiveMap barangay={barangay === 'All CPG barangays' ? 'All barangays' : barangay} full fullScreen onFeatureSelect={setSelectedFeature} onMinimize={() => onMapOnlyChange?.(false)} urbanHazard={urbanHazard} visibleLayers={visibleLayers} />
      </main>
    )
  }

  return (
    <div className="page">
      <div className="hazard-layout">
        <Panel className="hazard-map-panel">
          <SectionHeading detail="Choose an exposure map, focus a barangay, then select a colored item for more information." title="CPG hazard map" action={<div className="hazard-heading-actions"><button className="action-button" onClick={refresh} type="button"><RefreshCw className="action-button__icon" /> Refresh</button><button className="action-button" onClick={() => onMapOnlyChange?.(true)} type="button"><Maximize2 className="action-button__icon" /> Full map view</button><button className="action-button-primary" type="button"><Plus className="action-button__icon" /> Add zone</button></div>} />

          <section aria-label="Map controls" className="hazard-controls">
            <ControlLabel label="Focus area"><span className="hazard-select-wrap"><MapPin className="hazard-select-icon" /><select className="hazard-select" onChange={(event) => setBarangay(event.target.value)} value={barangay}><option>All CPG barangays</option><option>Pitogo</option><option>Lapinig</option><option>Baud</option><option>San Vicente</option></select></span></ControlLabel>
            <ControlLabel label="Urban exposure map"><span className="hazard-select-wrap"><span className="hazard-select-icon hazard-select-icon--dot" style={{ backgroundColor: exposure.color }} /><select className="hazard-select hazard-select--dot" onChange={(event) => setUrbanHazard(event.target.value as UrbanHazard)} value={urbanHazard}>{urbanHazards.map((hazard) => <option key={hazard.key}>{hazard.key}</option>)}</select></span></ControlLabel>
            <div className="hazard-reset-area"><button className="action-button action-button--h10 action-button--block" onClick={() => setBarangay('All barangays')} type="button"><Route className="action-button__icon" /> Reset view</button></div>
          </section>

          <LiveMap barangay={barangay === 'All CPG barangays' ? 'All barangays' : barangay} full onFeatureSelect={setSelectedFeature} urbanHazard={urbanHazard} visibleLayers={visibleLayers} />

          <section aria-live="polite" className="hazard-selection"><span className="hazard-selection__icon"><LocateFixed /></span><div><p className="hazard-selection__label">Selected map item</p><p className="hazard-selection__text">{selectedFeature}</p></div></section>

          <section className="hazard-updates"><SectionHeading detail="Recent field updates entered by responders." title="Operational updates" /><div className="hazard-updates__grid">{[['Safe route cleared', 'Pitogo', '8 min ago', 'success'], ['Blocked route', 'Baud', '14 min ago', 'warning'], ['Coastal warning sign', 'Lapinig', '20 min ago', 'danger']].map(([title, location, added, tone]) => <div className="hazard-update-card" key={title}><p className="hazard-update-card__title">{title}</p><p className="hazard-update-card__meta">{location} · {added}</p><span className="hazard-update-card__status"><StatusPill tone={tone as 'success' | 'warning' | 'danger'}>{tone === 'success' ? 'Verified' : tone === 'warning' ? 'Assessing' : 'Active'}</StatusPill></span></div>)}</div></section>
        </Panel>

        <aside className="hazard-aside stack-5">
          <Panel className="panel--pad-4"><SectionHeading detail="Turn layers on only when they help your current response task." title="Map layers" /><div className="stack-1">{mapLayers.map((layer) => <LayerToggle color={layer.color} enabled={visibleLayers.includes(layer.key)} key={layer.key} label={layer.label} onToggle={() => toggleLayer(layer.key)} />)}</div></Panel>
          <Panel className="panel--pad-4"><SectionHeading title="Current exposure" /><div className="hazard-exposure"><div className="hazard-exposure__row"><span className="hazard-exposure__dot" style={{ backgroundColor: exposure.color }} /><span className="hazard-exposure__name">{urbanHazard}</span></div><p className="hazard-exposure__detail">{exposure.detail}. Turn on Hazard zones to show this operational overlay; verify conditions on the ground before action.</p></div></Panel>
          <Panel className="panel--pad-4"><SectionHeading title="Priority alerts" />{alerts.map((alert) => <div className={`hazard-alert hazard-alert--${alert.tone}`} key={alert.title}><div className="hazard-alert__row"><TriangleAlert className="hazard-alert__icon" /><div className="hazard-alert__body"><p className="hazard-alert__title">{alert.title}</p><p className="hazard-alert__detail">{alert.detail}</p><p className="hazard-alert__time">{alert.time}</p></div></div></div>)}</Panel>
          <Panel className="panel--pad-4"><SectionHeading title="Mapped hazard zones" />{zones.map((zone) => <button className="hazard-zone" key={zone.name} onClick={() => { setBarangay(zone.barangay); setSelectedFeature(`${zone.name} — ${zone.details}`) }} type="button"><span className={`hazard-zone__dot hazard-zone__dot--${zone.tone}`} /><span className="hazard-zone__body"><span className="hazard-zone__name">{zone.name}</span><span className="hazard-zone__meta">{zone.barangay} · {zone.details}</span></span><span className="hazard-zone__aside"><StatusPill tone={zone.level === 'Critical' ? 'danger' : 'warning'}>{zone.level}</StatusPill><ChevronRight className="hazard-zone__chevron" /></span></button>)}</Panel>
          <div className="hazard-tip"><CircleHelp /> Use the layer list to reduce clutter; hover or select an item directly on the map to inspect it.</div>
        </aside>
      </div>
    </div>
  )
}
