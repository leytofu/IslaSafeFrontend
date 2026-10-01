import type { LucideIcon } from 'lucide-react'

type Tone = 'rose' | 'amber' | 'indigo' | 'blue'

const toneClasses: Record<Tone, { icon: string; value: string; change: string }> = {
  rose: { icon: 'bg-rose-500/15 text-rose-400', value: 'text-rose-400', change: 'text-rose-300' },
  amber: { icon: 'bg-amber-400/15 text-amber-300', value: 'text-amber-300', change: 'text-amber-300' },
  indigo: { icon: 'bg-indigo-500/15 text-indigo-300', value: 'text-indigo-300', change: 'text-emerald-300' },
  blue: { icon: 'bg-blue-500/15 text-blue-300', value: 'text-blue-300', change: 'text-slate-500' },
}

interface StatusCardProps {
  label: string
  value: string
  change: string
  icon: LucideIcon
  tone: Tone
  onClick?: () => void
}

export function StatusCard({ label, value, change, icon: Icon, tone, onClick }: StatusCardProps) {
  const classes = toneClasses[tone]

  return (
    <button className={`group relative overflow-hidden rounded-2xl border border-white/9 bg-white/[0.045] p-5 text-left shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.07] ${tone === 'rose' ? 'ring-1 ring-rose-400/25 hover:ring-rose-300/45' : ''}`} onClick={onClick} type="button">
      <span className={`absolute -bottom-10 -right-8 size-28 rounded-full blur-3xl ${tone === 'rose' ? 'bg-rose-500/15' : 'bg-indigo-500/10'}`} />
      <span className="relative flex items-start justify-between gap-4">
        <span>
          <span className="block text-xs font-semibold text-slate-400">{label}</span>
          <span className={`mt-2 block font-display text-4xl font-bold tracking-tight ${classes.value}`}>{value}</span>
        </span>
        <span className={`grid size-10 place-items-center rounded-xl ${classes.icon}`}><Icon className="size-5" /></span>
      </span>
      <span className={`relative mt-3 block font-mono text-[10px] ${classes.change}`}>{change}</span>
    </button>
  )
}
