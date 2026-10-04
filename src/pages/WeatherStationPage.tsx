import { Activity, CheckCircle2, CloudRain, CloudSun, Phone, ShieldAlert, Waves, Wind } from 'lucide-react'
import { Panel, SectionHeading, StatusPill } from '../components/Primitives'
import './WeatherStationPage.css'

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
    <div className="weather-layout">
      <div className="stack-5">
        <Panel className="panel--pad-5">
          <SectionHeading action={<StatusPill tone="success">Online</StatusPill>} detail="Live reading from AWS Unit — Pitogo Island, CPG · Updated 2 min ago" title="Automated Weather Station" />
          <div className="weather-readings">
            {readings.map(([label, value, Icon]) => <div className="weather-reading" key={label as string}>
              <div className="weather-reading__header"><span className="weather-reading__label">{label as string}</span><Icon className="weather-reading__icon" /></div>
              <p className="weather-reading__value">{value as string}</p>
            </div>)}
          </div>
        </Panel>
        <Panel className="panel--pad-5">
          <SectionHeading title="PAG-ASA advisory" />
          <div className="weather-advisory">
            <p className="weather-advisory__title"><ShieldAlert /> Signal No. 2 — Typhoon AGHON</p>
            <p className="weather-advisory__time">Updated 6 min ago</p>
            <p className="weather-advisory__text">Winds of 61–88 km/h are expected within 24 hours. Landfall is imminent over the CPG island group. Mandatory evacuation remains in effect for all coastal barangays.</p>
          </div>
        </Panel>
      </div>
      <div className="stack-5">
        <Panel className="panel--pad-5">
          <SectionHeading title="Integration status" />
          {[
            ['AWS API connection', 'Secure link to MDRRMO-CPG weather unit', 'Stable'],
            ['Data sync interval', 'Refreshes automatically', 'Every 2 min'],
            ['Last successful pull', 'From Pitogo AWS Unit', '2 min ago'],
          ].map(([title, detail, status]) => <div className="weather-row" key={title}>
            <div><p className="weather-row__title">{title}</p><p className="weather-row__detail">{detail}</p></div>
            <StatusPill tone={title === 'AWS API connection' ? 'success' : 'info'}>{status}</StatusPill>
          </div>)}
        </Panel>
        <Panel className="panel--pad-5">
          <SectionHeading title="MDRRMO-CPG emergency contacts" />
          {[
            ['Emergency hotline', '0917-XXX-XXXX', true], ['Office landline', '(038) XXX-XXXX', false], ['BDRRMC Pitogo', '0918-XXX-XXXX', false],
          ].map(([name, phone, urgent]) => <div className="weather-row" key={name as string}>
            <div><p className="weather-row__title">{name as string}</p><p className="weather-row__detail weather-row__detail--mono">{phone as string}</p></div>
            <button className={urgent ? 'action-button-primary' : 'action-button'} type="button"><Phone className="action-button__icon" /> Call</button>
          </div>)}
        </Panel>
      </div>
    </div>
  )
}
