import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { StatusPill, TableFrame } from '../components/Primitives'
import { SearchField } from '../components/SearchField'
import { statusTone } from '../utils/statusTone'
import { residentRecords } from '../data/residentRecords'

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
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <div className="flex flex-wrap gap-2">
        <SearchField onChange={setQuery} placeholder="Search residents by name or ID..." value={query} />
        <select className="h-9 rounded-lg border border-white/10 bg-[#0d1424] px-3 text-xs text-slate-300 outline-none" onChange={(event) => setBarangay(event.target.value)} value={barangay}><option>All barangays</option><option>Pitogo</option><option>Lapinig</option><option>San Vicente</option><option>Baud</option><option>Aguining</option></select>
        <select className="h-9 rounded-lg border border-white/10 bg-[#0d1424] px-3 text-xs text-slate-300 outline-none" onChange={(event) => setStatus(event.target.value)} value={status}><option>All status</option><option>Safe</option><option>Evacuated</option><option>Stranded</option><option>Needs assistance</option></select>
        <button className="action-button-primary ml-auto" type="button"><Plus className="size-3.5" /> Add resident</button>
      </div>
      <TableFrame>
        <thead className="portal-table"><tr><th>Resident ID</th><th>Full name</th><th>Barangay / Purok</th><th>Contact no.</th><th>Household</th><th>Status</th><th /></tr></thead>
        <tbody className="portal-table">
          {visible.map((item) => <tr key={item.id}><td className="font-mono text-[11px] text-indigo-200">{item.id}</td><td className="font-semibold text-slate-100">{item.name}</td><td>{item.location}</td><td className="font-mono text-[10px] text-slate-400">{item.phone}</td><td>{item.household}</td><td><StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill></td><td><button aria-label={`View ${item.id}`} className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white" type="button"><ChevronRight className="size-4" /></button></td></tr>)}
          {visible.length === 0 && <tr><td className="px-4 py-10 text-center text-xs text-slate-500" colSpan={7}>No residents match the current filters.</td></tr>}
        </tbody>
      </TableFrame>
    </div>
  )
}
