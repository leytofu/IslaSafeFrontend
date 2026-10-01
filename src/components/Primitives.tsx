import type { ReactNode } from 'react'

type Tone = 'danger' | 'warning' | 'success' | 'info' | 'muted'

const toneClasses: Record<Tone, string> = {
  danger: 'border-rose-400/25 bg-rose-500/10 text-rose-200',
  warning: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  info: 'border-indigo-400/25 bg-indigo-400/10 text-indigo-100',
  muted: 'border-white/10 bg-white/5 text-slate-400',
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-base font-semibold text-white">{title}</h2>
        {detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatusPill({ children, tone = 'muted' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold ${toneClasses[tone]}`}><span className="size-1.5 rounded-full bg-current" />{children}</span>
}

export function MetricTile({ label, value, detail, tone = 'info' }: { label: string; value: ReactNode; detail?: string; tone?: Tone }) {
  const valueClass: Record<Tone, string> = { danger: 'text-rose-400', warning: 'text-amber-300', success: 'text-emerald-300', info: 'text-indigo-300', muted: 'text-slate-100' }
  return (
    <Panel className="relative overflow-hidden p-4">
      <span className={`absolute -right-5 -top-6 size-20 rounded-full blur-2xl ${tone === 'danger' ? 'bg-rose-500/20' : tone === 'warning' ? 'bg-amber-400/15' : 'bg-indigo-500/15'}`} />
      <p className="relative text-xs font-medium text-slate-400">{label}</p>
      <p className={`relative mt-2 font-display text-[26px] font-bold tracking-tight ${valueClass[tone]}`}>{value}</p>
      {detail && <p className="relative mt-2 font-mono text-[10px] text-slate-500">{detail}</p>}
    </Panel>
  )
}

export function TableFrame({ children, className = '', tableClassName = '', ariaLabel }: { children: ReactNode; className?: string; tableClassName?: string; ariaLabel?: string }) {
  return <Panel className={`overflow-x-auto p-0 ${className}`}><table aria-label={ariaLabel} className={`w-full min-w-[720px] border-collapse text-left ${tableClassName}`}>{children}</table></Panel>
}

export function FilterButton({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return <button className={`filter-chip ${active ? 'active' : ''}`} onClick={onClick} type="button">{children}</button>
}
