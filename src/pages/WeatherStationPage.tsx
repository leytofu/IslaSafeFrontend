import { Activity, CheckCircle2, CloudRain, CloudSun, Phone, ShieldAlert, Waves, Wind } from 'lucide-react'
import { Panel, SectionHeading, StatusPill } from '../components/Primitives'

function SunIcon({ className }: { className?: string }) {
  return <CloudSun className={className} />
}

export function WeatherStationPage() {
  const readings = [
    ['Temperature', '27.4°C', CloudSun], ['Wind speed', '68 km/h', Wind], ['Wind direction', 'NNE', Wind],
    ['Rainfall', '42 mm/hr', CloudRain], ['Humidity', '86%', Waves], ['Water level', '1.8 m', Waves],
    ['Pressure', '998 hPa', Activity], ['UV index', '3 · Moderate', SunIcon], ['Sensor uptime', '99.6%', CheckCircle2],
  ]

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(330px,1fr)]">
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeading action={<StatusPill tone="success">Online</StatusPill>} detail="Live reading from AWS Unit — Pitogo Island, CPG · Updated 2 min ago" title="Automated Weather Station" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {readings.map(([label, value, Icon]) => <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4" key={label as string}>
              <div className="flex items-center justify-between text-slate-500"><span className="text-xs">{label as string}</span><Icon className="size-4 text-indigo-300" /></div>
              <p className="mt-3 font-display text-xl font-semibold text-slate-100">{value as string}</p>
            </div>)}
          </div>
        </Panel>
        <Panel className="p-5">
          <SectionHeading title="PAG-ASA advisory" />
          <div className="rounded-xl border-l-[3px] border-rose-500 bg-rose-500/8 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-100"><ShieldAlert className="size-4 text-rose-400" /> Signal No. 2 — Typhoon AGHON</p>
            <p className="mt-1.5 font-mono text-[10px] text-rose-200/60">Updated 6 min ago</p>
            <p className="mt-3 text-xs leading-5 text-slate-300">Winds of 61–88 km/h are expected within 24 hours. Landfall is imminent over the CPG island group. Mandatory evacuation remains in effect for all coastal barangays.</p>
          </div>
        </Panel>
      </div>
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeading title="Integration status" />
          {[
            ['AWS API connection', 'Secure link to MDRRMO-CPG weather unit', 'Stable'],
            ['Data sync interval', 'Refreshes automatically', 'Every 2 min'],
            ['Last successful pull', 'From Pitogo AWS Unit', '2 min ago'],
          ].map(([title, detail, status]) => <div className="flex items-center justify-between gap-3 border-b border-white/8 py-3 last:border-0" key={title}>
            <div><p className="text-xs font-semibold text-slate-200">{title}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>
            <StatusPill tone={title === 'AWS API connection' ? 'success' : 'info'}>{status}</StatusPill>
          </div>)}
        </Panel>
        <Panel className="p-5">
          <SectionHeading title="MDRRMO-CPG emergency contacts" />
          {[
            ['Emergency hotline', '0917-XXX-XXXX', true], ['Office landline', '(038) XXX-XXXX', false], ['BDRRMC Pitogo', '0918-XXX-XXXX', false],
          ].map(([name, phone, urgent]) => <div className="flex items-center justify-between gap-3 border-b border-white/8 py-3 last:border-0" key={name as string}>
            <div><p className="text-xs font-semibold text-slate-200">{name as string}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{phone as string}</p></div>
            <button className={urgent ? 'action-button-primary' : 'action-button'} type="button"><Phone className="size-3.5" /> Call</button>
          </div>)}
        </Panel>
      </div>
    </div>
  )
}
