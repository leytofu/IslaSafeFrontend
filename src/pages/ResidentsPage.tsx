import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { StatusPill, TableFrame } from '../components/Primitives'
import { SearchField } from '../components/SearchField'
import { statusTone } from '../utils/statusTone'
import { residentRecords } from '../data/residentRecords'
import './ResidentsPage.css'

export function ResidentsPage() {
  const [query, setQuery] = useState('')
  const [barangay, setBarangay] = useState('All barangays')
  const [status, setStatus] = useState('All status')
  const visible = residentRecords.filter((item) => {
    const matchesStatus = status === 'All status' || item.status === status
    const matchesBarangay = barangay === 'All barangays' || item.location.startsWith(barangay)
    const matchesSearch = `${item.name} ${item.location} ${item.id}`.toLowerCase().includes(query.toLowerCase())
    return matchesStatus && matchesBarangay && matchesSearch
  })

  return (
    <div className="page stack-5">
      <div className="resident-filters">
        <SearchField onChange={setQuery} placeholder="Search residents by name or ID..." value={query} />
        <select className="resident-select" onChange={(event) => setBarangay(event.target.value)} value={barangay}><option>All barangays</option><option>Pitogo</option><option>Lapinig</option><option>San Vicente</option><option>Baud</option><option>Aguining</option></select>
        <select className="resident-select" onChange={(event) => setStatus(event.target.value)} value={status}><option>All status</option><option>Safe</option><option>Evacuated</option><option>Stranded</option><option>Needs assistance</option></select>
        <button className="action-button-primary action-button-primary--ml-auto" type="button"><Plus className="action-button__icon" /> Add resident</button>
      </div>
      <TableFrame>
        <thead className="portal-table"><tr><th>Resident ID</th><th>Full name</th><th>Barangay / Purok</th><th>Contact no.</th><th>Household</th><th>Status</th><th /></tr></thead>
        <tbody className="portal-table">
          {visible.map((item) => <tr key={item.id}><td className="cell-id">{item.id}</td><td className="cell-primary">{item.name}</td><td>{item.location}</td><td className="cell-mono">{item.phone}</td><td>{item.household}</td><td><StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill></td><td><button aria-label={`View ${item.id}`} className="table-icon-button" type="button"><ChevronRight /></button></td></tr>)}
          {visible.length === 0 && <tr><td className="cell-empty cell-empty--compact" colSpan={7}>No residents match the current filters.</td></tr>}
        </tbody>
      </TableFrame>
    </div>
  )
}
