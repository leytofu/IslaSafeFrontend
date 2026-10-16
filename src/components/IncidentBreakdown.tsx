import { useState } from 'react'
import type { IncidentPeriod } from '../types/incidents'
import { incidentChart } from '../utils/incidentChart'
import { useIncidentStatistics } from '../hooks/useIncidentStatistics'
import './IncidentBreakdown.css'

export function IncidentBreakdown({ sessionKey, onOpenIncidents, onActiveCount }: { sessionKey: string; onOpenIncidents: () => void; onActiveCount: (count: number) => void }) {
  const [period, setPeriod] = useState<IncidentPeriod>('week')
  const { data, error, loading, refresh } = useIncidentStatistics(sessionKey, period, onActiveCount)
  const chart = incidentChart(data?.breakdown ?? [])
  return (
    <section className="incident-breakdown panel" aria-labelledby="incident-statistics-title" aria-busy={loading}>
      <div className="incident-breakdown__header">
        <div><h2 className="incident-breakdown__title" id="incident-statistics-title">Incident statistics</h2><p className="incident-breakdown__period">Logged incidents · Philippine time</p></div>
        <label className="incident-breakdown__filter"><span className="visually-hidden">Incident statistics period</span><select className="evac-filter" value={period} onChange={(event) => setPeriod(event.target.value as IncidentPeriod)}><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option><option value="all">All time</option></select></label>
      </div>
      {error && <div className="incident-breakdown__error" role="alert"><span>{data ? 'Showing the last successful update. ' : ''}{error}</span><button className="action-button" onClick={refresh} type="button">Retry</button></div>}
      {loading && !data ? <p className="incident-breakdown__message" role="status">Loading incident statistics…</p> : data && <>
        <div className="incident-breakdown__body">
          <div className="incident-breakdown__chart" role="img" aria-label={`${data.total} logged incidents: ${chart.items.map((item) => `${item.type}: ${item.count}`).join(', ')}`} style={{ background: chart.background }}>
            <div className="incident-breakdown__chart-center"><strong>{data.total}</strong><span>{data.total === 1 ? 'incident' : 'incidents'}</span></div>
          </div>
          <div className="incident-breakdown__list stack-2.5">
            {chart.items.map((item) => <div className="incident-breakdown__row" key={item.type} title={`${item.type}: ${item.count} incidents (${item.percent.toFixed(1)}%)`}><span className="incident-breakdown__swatch" style={{ backgroundColor: item.color }} /><span className="incident-breakdown__label">{item.type}</span><span className="incident-breakdown__value">{item.count} ({item.percent.toFixed(1)}%)</span></div>)}
          </div>
        </div>
        {data.total === 0 && <p className="incident-breakdown__message">No incidents logged for this period.</p>}
        <p className="incident-breakdown__summary">{data.active} active · {data.resolved} resolved or closed</p>
      </>}
      <div className="incident-breakdown__footer"><span>{data ? `Updated ${new Date(data.to).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' })} · refreshes every 15s` : 'Statistics use saved incident reports.'}</span><button className="action-button" onClick={onOpenIncidents} type="button">View incidents &rarr;</button></div>
    </section>
  )
}
