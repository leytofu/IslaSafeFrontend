import { Building2, MapPin } from 'lucide-react'
import { Panel, StatusPill } from './Primitives'
import type { EvacuationCenter } from '../data/evacuationCenters'
import { statusTone } from '../utils/statusTone'
import './EvacuationCenterCard.css'

export function EvacuationCenterCard({ center }: { center: EvacuationCenter }) {
  const occupancy = Math.round((center.current / center.capacity) * 100)
  return <Panel className="evac-card"><div className="evac-card__header"><span className="evac-card__icon"><Building2 /></span><StatusPill tone={statusTone(center.status)}>{center.status}</StatusPill></div><h2 className="evac-card__name">{center.name}</h2><p className="evac-card__location"><MapPin /> Barangay {center.barangay}</p><div className="evac-card__occupancy"><div className="evac-card__occupancy-row"><span className="evac-card__occupancy-label">Occupancy</span><span className="evac-card__occupancy-value">{center.current} / {center.capacity}</span></div><div className="evac-card__bar"><div className={`evac-card__bar-fill${occupancy > 80 ? ' evac-card__bar-fill--high' : ''}`} style={{ width: `${occupancy}%` }} /></div></div><div className="evac-card__footer"><span className="evac-card__contact">{center.contact}</span><button className="evac-card__roster" type="button">View roster →</button></div></Panel>
}
