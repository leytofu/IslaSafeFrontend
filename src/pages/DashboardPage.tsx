import { AlertTriangle, Building2, Megaphone, Siren } from 'lucide-react'
import { IncidentBreakdown } from '../components/IncidentBreakdown'
import { LiveMap } from '../components/LiveMap'
import { ResponsePanels } from '../components/ResponsePanels'
import { StatusCard } from '../components/StatusCard'
import type { SosRequest } from '../data/sosRequests'
import './DashboardPage.css'

interface DashboardPageProps {
  onOpenMap: () => void
  sosRequests: SosRequest[]
  onOpenSosRequest: (id: string) => void
}

export function DashboardPage({ onOpenMap, sosRequests, onOpenSosRequest }: DashboardPageProps) {
  return (
    <div className="page stack-5">
      <section className="metric-grid">
        <StatusCard change="▲ +4 from yesterday · tap to respond" icon={Siren} label="Active SOS Requests" onClick={() => undefined} tone="rose" value="12" />
        <StatusCard change="▲ +2 from yesterday" icon={AlertTriangle} label="Active Incidents" tone="amber" value="8" />
        <StatusCard change="● All operational" icon={Building2} label="Evacuation Centers" tone="indigo" value="15" />
        <StatusCard change="● Active this week" icon={Megaphone} label="Advisories Sent" tone="blue" value="5" />
      </section>

      <section className="dashboard-main">
        <div className="stack-5">
          <section className="dashboard-map-panel panel">
            <div className="dashboard-map__header">
              <div><h2 className="dashboard-map__title">Live overview map</h2><p className="dashboard-map__subtitle">President Carlos P. Garcia (CPG), Bohol</p></div>
              <button className="dashboard-map__open" onClick={onOpenMap} type="button">Open full map →</button>
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
