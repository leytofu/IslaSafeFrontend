import { AlertTriangle, Building2, Megaphone, Siren } from 'lucide-react'
import { IncidentBreakdown } from '../components/IncidentBreakdown'
import { LiveMap } from '../components/LiveMap'
import { ResponsePanels } from '../components/ResponsePanels'
import { StatusCard } from '../components/StatusCard'
import type { SosRequest } from '../data/sosRequests'

interface DashboardPageProps {
  onOpenMap: () => void
  sosRequests: SosRequest[]
  onOpenSosRequest: (id: string) => void
}

export function DashboardPage({ onOpenMap, sosRequests, onOpenSosRequest }: DashboardPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard change="▲ +4 from yesterday · tap to respond" icon={Siren} label="Active SOS Requests" onClick={() => undefined} tone="rose" value="12" />
        <StatusCard change="▲ +2 from yesterday" icon={AlertTriangle} label="Active Incidents" tone="amber" value="8" />
        <StatusCard change="● All operational" icon={Building2} label="Evacuation Centers" tone="indigo" value="15" />
        <StatusCard change="● Active this week" icon={Megaphone} label="Advisories Sent" tone="blue" value="5" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2.05fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          <section className="panel p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h2 className="font-display text-base font-semibold text-white">Live overview map</h2><p className="mt-1 text-xs text-slate-500">President Carlos P. Garcia (CPG), Bohol</p></div>
              <button className="shrink-0 text-xs font-semibold text-indigo-300 transition hover:text-indigo-200" onClick={onOpenMap} type="button">Open full map →</button>
            </div>
            <LiveMap />
          </section>
          <IncidentBreakdown />
        </div>
        <ResponsePanels onOpenSosRequest={onOpenSosRequest} requests={sosRequests} />
      </section>
    </div>
  )
}
