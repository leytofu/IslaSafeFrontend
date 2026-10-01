import { Building2, MapPin } from 'lucide-react'
import { Panel, StatusPill } from './Primitives'
import type { EvacuationCenter } from '../data/evacuationCenters'
import { statusTone } from '../utils/statusTone'

export function EvacuationCenterCard({ center }: { center: EvacuationCenter }) {
  const occupancy = Math.round((center.current / center.capacity) * 100)
  return <Panel className="group p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-200"><Building2 className="size-5" /></span><StatusPill tone={statusTone(center.status)}>{center.status}</StatusPill></div><h2 className="mt-5 font-display text-base font-semibold text-white">{center.name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="size-3.5" /> Barangay {center.barangay}</p><div className="mt-5"><div className="flex justify-between text-xs"><span className="text-slate-400">Occupancy</span><span className="font-mono font-semibold text-slate-200">{center.current} / {center.capacity}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8"><div className={occupancy > 80 ? 'h-full rounded-full bg-amber-400' : 'h-full rounded-full bg-emerald-400'} style={{ width: `${occupancy}%` }} /></div></div><div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4"><span className="font-mono text-[10px] text-slate-500">{center.contact}</span><button className="text-xs font-semibold text-indigo-300 transition hover:text-indigo-100" type="button">View roster →</button></div></Panel>
}
