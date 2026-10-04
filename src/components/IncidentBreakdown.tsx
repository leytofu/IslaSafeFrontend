import './IncidentBreakdown.css'

const breakdown = [
  { label: 'SOS Requests', value: '12 (32%)', color: '#f43f5e' },
  { label: 'Intense Rains', value: '10 (27%)', color: '#3b82f6' },
  { label: 'Landslide', value: '6 (16%)', color: '#f59e0b' },
  { label: 'Typhoon', value: '5 (14%)', color: '#a78bfa' },
  { label: 'Others', value: '4 (11%)', color: '#64748b' },
]

export function IncidentBreakdown() {
  return (
    <section className="incident-breakdown panel">
      <div className="incident-breakdown__header">
        <h2 className="incident-breakdown__title">Incident statistics</h2>
        <p className="incident-breakdown__period">This week</p>
      </div>
      <div className="incident-breakdown__body">
        <div className="incident-breakdown__chart" style={{ background: 'conic-gradient(#f43f5e 0 32%, #3b82f6 32% 59%, #f59e0b 59% 75%, #a78bfa 75% 89%, #64748b 89% 100%)' }}>
          <div className="incident-breakdown__chart-center">
            <strong>37</strong>
            <span>incidents</span>
          </div>
        </div>
        <div className="incident-breakdown__list stack-2.5">
          {breakdown.map((item) => (
            <div className="incident-breakdown__row" key={item.label}>
              <span className="incident-breakdown__swatch" style={{ backgroundColor: item.color }} />
              <span className="incident-breakdown__label">{item.label}</span>
              <span className="incident-breakdown__value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
