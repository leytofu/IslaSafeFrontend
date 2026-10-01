import { ArrowUpRight, CircleCheckBig, Clock3, FileText, type LucideIcon } from 'lucide-react'
import type { PageName } from './Sidebar'

const descriptions: Partial<Record<PageName, string>> = {
  'SOS Management': 'Prioritize and coordinate live emergency requests reported by residents.',
  'Evacuation Centers': 'Monitor operational capacity and availability across registered centers.',
  'Incident Monitoring': 'Review current incident reports and response statuses.',
  'MDRRMO Link / AWS': 'View the latest weather station and regional monitoring signals.',
  Advisories: 'Prepare and distribute official notices to affected barangays.',
  Residents: 'Maintain verified resident records and household information.',
  'Reports & Analytics': 'Review operational trends and export formal response reports.',
  Settings: 'Manage dashboard preferences and system configuration.',
}

interface ModulePreviewProps {
  icon: LucideIcon
  page: Exclude<PageName, 'Dashboard' | 'Hazard Map'>
}

export function ModulePreview({ icon: Icon, page }: ModulePreviewProps) {
  return (
    <div className="mx-auto max-w-[1600px]">
      <section className="panel overflow-hidden p-0">
        <div className="border-b border-white/8 bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl border border-indigo-300/20 bg-indigo-500/15 text-indigo-200"><Icon className="size-6" /></span>
          <h2 className="mt-5 font-display text-2xl font-bold text-white">{page}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{descriptions[page]}</p>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          {[
            ['Live operational view', 'Connected to dashboard data', CircleCheckBig],
            ['Response queue', 'Prioritized by urgency', Clock3],
            ['Activity records', 'Latest updates and exports', FileText],
          ].map(([title, detail, CardIcon]) => {
            const CardIconComponent = CardIcon as LucideIcon
            return <button className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 text-left transition hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]" key={title as string} type="button"><CardIconComponent className="size-5 text-indigo-300" /><p className="mt-8 text-sm font-semibold text-slate-100">{title as string}</p><p className="mt-1 text-xs text-slate-500">{detail as string}</p><ArrowUpRight className="mt-4 size-4 text-slate-600" /></button>
          })}
        </div>
      </section>
    </div>
  )
}
