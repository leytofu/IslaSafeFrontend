import { Bell, Menu, Search, Sun } from 'lucide-react'
import type { PageName } from './Sidebar'

interface TopbarProps {
  page: PageName
  onOpenMenu: () => void
}

const pageDescriptions: Partial<Record<PageName, string>> = {
  Dashboard: "Welcome back — here's what is happening across CPG Island today.",
  'Hazard Map': 'Monitor active zones, evacuation centers, and response markers.',
  'SOS Management': 'Coordinate incoming calls for emergency assistance.',
}

export function Topbar({ page, onOpenMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/8 bg-[#050810]/75 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button aria-label="Open navigation" className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 lg:hidden" onClick={onOpenMenu} type="button">
        <Menu className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="font-display truncate text-xl font-semibold tracking-tight text-white">{page}</h1>
        <p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block">{pageDescriptions[page] ?? 'Coordinate response operations from one secure workspace.'}</p>
      </div>

      <label className="relative hidden w-72 lg:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input className="h-10 w-full rounded-xl border border-white/9 bg-white/[0.045] pl-10 pr-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/50 focus:bg-white/[0.07]" placeholder="Search residents, SOS ID, barangay..." />
      </label>

      <div className="hidden text-right font-mono text-[10px] leading-4 text-slate-500 xl:block">
        <p className="font-semibold text-slate-200">09:41 AM</p>
        <p>Sat, May 25, 2024</p>
      </div>
      <button aria-label="Toggle theme" className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-slate-400 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white" type="button">
        <Sun className="size-[17px]" />
      </button>
      <button aria-label="View notifications" className="relative grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-slate-400 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white" type="button">
        <Bell className="size-[17px]" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-[#0b1020]" />
      </button>
    </header>
  )
}
