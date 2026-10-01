import { useState, type ReactNode } from 'react'
import { ChevronRight, Send } from 'lucide-react'
import { FilterButton, Panel, SectionHeading, StatusPill, TableFrame } from '../components/Primitives'
import { statusTone } from '../utils/statusTone'
import { initialAdvisoryRecords, type AdvisoryPriority } from '../data/advisoryRecords'

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</span><span className="field-control">{children}</span></label>
}

export function AdvisoriesPage() {
  const [items, setItems] = useState(initialAdvisoryRecords)
  const [filter, setFilter] = useState('All')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<AdvisoryPriority>('Info')
  const visible = items.filter((item) => filter === 'All' || item.priority === filter)

  const send = () => {
    if (!title.trim() || !message.trim()) return
    setItems((current) => [{ id: `ADV-${String(15 + current.length).padStart(3, '0')}`, title, target: 'All barangays', sent: 'Just now', recipients: 1247, priority }, ...current])
    setTitle('')
    setMessage('')
    setPriority('Info')
  }

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">{['All', 'Critical', 'Warning', 'Info'].map((item) => <FilterButton active={filter === item} key={item} onClick={() => setFilter(item)}>{item}</FilterButton>)}</div>
        <TableFrame>
          <thead className="portal-table"><tr><th>ID</th><th>Title</th><th>Target</th><th>Sent</th><th>Recipients</th><th>Priority</th><th /></tr></thead>
          <tbody className="portal-table">{visible.map((item) => <tr key={item.id}><td className="font-mono text-[11px] text-indigo-200">{item.id}</td><td className="font-semibold text-slate-100">{item.title}</td><td>{item.target}</td><td className="font-mono text-[10px] text-slate-500">{item.sent}</td><td>{item.recipients.toLocaleString()}</td><td><StatusPill tone={statusTone(item.priority)}>{item.priority}</StatusPill></td><td><button aria-label={`View ${item.id}`} className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white" type="button"><ChevronRight className="size-4" /></button></td></tr>)}</tbody>
        </TableFrame>
      </div>
      <Panel className="h-fit p-5">
        <SectionHeading detail="Create a notice for residents and responders." title="New advisory" />
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); send() }}>
          <FormField label="Title"><input onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Typhoon Signal Update" required value={title} /></FormField>
          <FormField label="Priority"><select onChange={(event) => setPriority(event.target.value as AdvisoryPriority)} value={priority}><option>Critical</option><option>Warning</option><option>Info</option></select></FormField>
          <FormField label="Target recipients"><select><option>All barangays</option><option>Coastal barangays only</option><option>Pitogo and Lapinig</option></select></FormField>
          <FormField label="Message"><textarea onChange={(event) => setMessage(event.target.value)} placeholder="Write advisory details for residents..." required rows={5} value={message} /></FormField>
          <button className="action-button-primary w-full" type="submit"><Send className="size-3.5" /> Send advisory now</button>
        </form>
      </Panel>
    </div>
  )
}
