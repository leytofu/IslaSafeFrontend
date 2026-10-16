import { useState } from 'react'
import { useAdvisories } from '../hooks/useAdvisories'
import type { MapCenter } from '../types/evacuation'
import { AlertTriangle, Building2, Megaphone, Siren } from 'lucide-react'
import { IncidentBreakdown } from '../components/IncidentBreakdown'
import { LiveMap } from '../components/LiveMap'
import { ResponsePanels } from '../components/ResponsePanels'
import { StatusCard } from '../components/StatusCard'
import type { SosRequest } from '../data/sosRequests'
import './DashboardPage.css'

interface DashboardPageProps {
  sessionKey: string
  onOpenMap: () => void
  sosRequests: SosRequest[]
  onOpenSosRequest: (id: string) => void
  onOpenSosManagement: () => void
  onOpenAdvisories: () => void
  onOpenIncidents: () => void
}

export function DashboardPage({ sessionKey, onOpenMap, sosRequests, onOpenSosRequest, onOpenSosManagement, onOpenIncidents, onOpenAdvisories }: DashboardPageProps) {
  const advisories = useAdvisories(sessionKey)
  const [mapCenters, setMapCenters] = useState<MapCenter[] | null>(null)
  const [activeIncidents, setActiveIncidents] = useState<number | null>(null)
  return (
    <div className="page stack-5">
      <section className="metric-grid">
        <StatusCard change="Pending or response coming · tap to review" icon={Siren} label="Active SOS Requests" onClick={onOpenSosManagement} tone="rose" value={String(sosRequests.filter(request => request.status !== 'Resolved').length)} />
        <StatusCard change="Active, monitoring or responding · tap to review" icon={AlertTriangle} label="Active Incidents" onClick={onOpenIncidents} tone="amber" value={activeIncidents === null ? '…' : String(activeIncidents)} />
        <StatusCard change={mapCenters ? `${mapCenters.filter((center) => center.status === 'Operational').length} operational centers` : 'Loading center locations'} icon={Building2} label="Mapped Evacuation Centers" tone="indigo" value={mapCenters ? String(mapCenters.length) : '...'} />
        <StatusCard change={advisories.error ? 'Unable to load advisories' : 'Published notices - tap to review'} icon={Megaphone} label="Active Advisories" onClick={onOpenAdvisories} tone="blue" value={!advisories.loaded || advisories.error ? '-' : String(advisories.active.length)} />
      </section>

      <section className="dashboard-main">
        <div className="stack-5">
          <section className="dashboard-map-panel panel">
            <div className="dashboard-map__header">
              <div><h2 className="dashboard-map__title">Live overview map</h2><p className="dashboard-map__subtitle">President Carlos P. Garcia (CPG), Bohol</p></div>
              <button className="dashboard-map__open" onClick={onOpenMap} type="button">Open full map →</button>
            </div>
            <LiveMap sessionKey={sessionKey} onCentersLoaded={setMapCenters} />
          </section>
          <IncidentBreakdown sessionKey={sessionKey} onOpenIncidents={onOpenIncidents} onActiveCount={setActiveIncidents} />
        </div>
        <ResponsePanels advisories={advisories} onOpenAdvisories={onOpenAdvisories} onOpenSosRequest={onOpenSosRequest} requests={sosRequests} />
      </section>
    </div>
  )
}
