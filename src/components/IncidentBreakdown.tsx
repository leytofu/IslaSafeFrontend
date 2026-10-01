const breakdown = [
  { label: 'SOS Requests', value: '12 (32%)', color: '#f43f5e' },
  { label: 'Intense Rains', value: '10 (27%)', color: '#3b82f6' },
  { label: 'Landslide', value: '6 (16%)', color: '#f59e0b' },
  { label: 'Typhoon', value: '5 (14%)', color: '#a78bfa' },
  { label: 'Others', value: '4 (11%)', color: '#64748b' },
]

export function IncidentBreakdown() {
  return (
    <section className="panel p-5">
      <div className="mb-5">
        <h2 className="font-display text-base font-semibold text-white">Incident statistics</h2>
        <p className="mt-1 text-xs text-slate-500">This week</p>
      </div>
      <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start">
        <div className="relative grid size-32 shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#f43f5e 0 32%, #3b82f6 32% 59%, #f59e0b 59% 75%, #a78bfa 75% 89%, #64748b 89% 100%)' }}>
          <div className="grid size-20 place-items-center rounded-full bg-[#0c1323] text-center">
            <strong className="font-display text-2xl leading-none text-white">37</strong>
            <span className="mt-1 text-[9px] uppercase tracking-wide text-slate-500">incidents</span>
          </div>
        </div>
        <div className="w-full space-y-2.5">
          {breakdown.map((item) => (
            <div className="flex items-center gap-2 text-xs" key={item.label}>
              <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: item.color }} />
              <span className="flex-1 text-slate-400">{item.label}</span>
              <span className="font-mono text-[11px] font-semibold text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
