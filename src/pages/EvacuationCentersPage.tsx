import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddEvacuationCenterDialog } from '../components/AddEvacuationCenterDialog'
import { EvacuationCenterCard } from '../components/EvacuationCenterCard'
import { initialEvacuationCenters, type EvacuationCenter } from '../data/evacuationCenters'
import { SearchField } from '../components/SearchField'
import './EvacuationCentersPage.css'

export function EvacuationCentersPage() {
  const [query, setQuery] = useState('')
  const [centers, setCenters] = useState(initialEvacuationCenters)
  const [isAdding, setIsAdding] = useState(false)
  const visibleCenters = centers.filter((center) => `${center.name} ${center.barangay}`.toLowerCase().includes(query.toLowerCase()))
  const addCenter = (center: EvacuationCenter) => { setCenters((current) => [center, ...current]); setIsAdding(false) }
  return <div className="page stack-5"><div className="evac-toolbar"><SearchField onChange={setQuery} placeholder="Search evacuation centers..." value={query} /><button className="action-button-primary" onClick={() => setIsAdding(true)} type="button"><Plus className="action-button__icon" /> Add center</button></div><div className="evac-grid">{visibleCenters.map((center) => <EvacuationCenterCard center={center} key={center.name} />)}</div>{isAdding && <AddEvacuationCenterDialog onClose={() => setIsAdding(false)} onSave={addCenter} />}</div>
}
