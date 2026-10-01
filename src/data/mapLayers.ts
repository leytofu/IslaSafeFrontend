export type MapLayerKey = 'hazards' | 'evacuation' | 'sos' | 'routes' | 'edits' | 'barangays'

export const mapLayers: Array<{ key: MapLayerKey; label: string; color: string }> = [
  { key: 'hazards', label: 'Hazard zones', color: '#f59e0b' },
  { key: 'evacuation', label: 'Evacuation centers', color: '#22c55e' },
  { key: 'sos', label: 'Active SOS', color: '#f43f5e' },
  { key: 'routes', label: 'Safe routes', color: '#6366f1' },
  { key: 'edits', label: 'Response markers', color: '#e2e8f0' },
  { key: 'barangays', label: 'Barangay labels', color: '#cbd5e1' },
]

export type UrbanHazard = 'Flooding' | 'Ground shaking' | 'Liquefaction' | 'Sea level rise' | 'Storm surge' | 'Tsunami'

export const urbanHazards: Array<{ key: UrbanHazard; color: string; detail: string }> = [
  { key: 'Flooding', color: '#dc2626', detail: 'High and low flooding susceptibility' },
  { key: 'Ground shaking', color: '#f59e0b', detail: 'Ground-shaking exposure areas' },
  { key: 'Liquefaction', color: '#8b5cf6', detail: 'Liquefaction-prone urban areas' },
  { key: 'Sea level rise', color: '#0ea5e9', detail: 'Coastal sea-level-rise exposure' },
  { key: 'Storm surge', color: '#ef4444', detail: 'High, moderate, and low storm-surge exposure' },
  { key: 'Tsunami', color: '#2563eb', detail: 'Coastal tsunami exposure areas' },
]
