import { useState } from 'react'
import { Download } from 'lucide-react'
import { FilterButton, Panel, SectionHeading } from '../components/Primitives'
import { initialEvacuationCenters } from '../data/evacuationCenters'
import './ReportsPage.css'

function BarList({ values }: { values: Array<[string, number, string]> }) {
  return <div className="stack-4">{values.map(([label, value, color]) => <div key={label}><div className="bar-list__header"><span className="bar-list__label">{label}</span><span className="bar-list__value">{value}</span></div><div className="bar-list__track"><div className="bar-list__fill" style={{ width: `${value}%`, background: color }} /></div></div>)}</div>
}

export function ReportsPage() {
  const [range, setRange] = useState('This week')
  const centerOccupancy = initialEvacuationCenters.slice(0, 5).map((center) => [center.barangay, Math.round((center.current / center.capacity) * 100), center.current / center.capacity > 0.8 ? '#f59e0b' : '#22c55e'] as [string, number, string])

  return (
    <div className="page stack-5">
      <div className="reports-toolbar"><div className="chip-group">{['This week', 'This month', 'This year'].map((item) => <FilterButton active={range === item} key={item} onClick={() => setRange(item)}>{item}</FilterButton>)}</div><button className="action-button-primary action-button-primary--ml-auto" type="button"><Download className="action-button__icon" /> Export PDF</button></div>
      <div className="reports-grid reports-grid--two">
        <Panel className="panel--pad-5"><SectionHeading detail={range} title="Incidents by category" /><BarList values={[['SOS requests', 82, '#f43f5e'], ['Intense rains', 67, '#3b82f6'], ['Landslide', 44, '#f59e0b'], ['Typhoon', 36, '#a78bfa'], ['Others', 28, '#64748b']]} /></Panel>
        <Panel className="panel--pad-5"><SectionHeading detail={range} title="SOS response time (min)" /><BarList values={[['Mon', 56, '#818cf8'], ['Tue', 40, '#818cf8'], ['Wed', 69, '#818cf8'], ['Thu', 48, '#818cf8'], ['Fri', 31, '#818cf8'], ['Sat', 62, '#818cf8']]} /></Panel>
      </div>
      <div className="reports-grid reports-grid--three">
        <Panel className="panel--pad-5"><SectionHeading title="Barangay risk index" /><BarList values={[['Lapinig', 88, '#f43f5e'], ['Baud', 72, '#f59e0b'], ['Pitogo', 61, '#f59e0b'], ['San Vicente', 42, '#3b82f6'], ['Aguining', 24, '#22c55e']]} /></Panel>
        <Panel className="panel--pad-5"><SectionHeading title="Evacuation occupancy" /><BarList values={centerOccupancy} /></Panel>
        <Panel className="panel--pad-5"><SectionHeading title="Monthly summary" /><div className="stack-3">{[['Total incidents logged', '37'], ['Total SOS resolved', '129'], ['Residents registered', '1,247'], ['Advisories broadcast', '14']].map(([label, value]) => <div className="summary-row" key={label}><span className="summary-row__label">{label}</span><span className="summary-row__value">{value}</span></div>)}</div></Panel>
      </div>
    </div>
  )
}
