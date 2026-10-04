import type { ReactNode } from 'react'
import './Primitives.css'

type Tone = 'danger' | 'warning' | 'success' | 'info' | 'muted'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {detail && <p className="section-heading__detail">{detail}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatusPill({ children, tone = 'muted' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`status-pill status-pill--${tone}`}><span className="status-pill__dot" />{children}</span>
}

export function MetricTile({ label, value, detail, tone = 'info' }: { label: string; value: ReactNode; detail?: string; tone?: Tone }) {
  return (
    <Panel className="metric-tile">
      <span className={`metric-tile__orb metric-tile__orb--${tone}`} />
      <p className="metric-tile__label">{label}</p>
      <p className={`metric-tile__value metric-tile__value--${tone}`}>{value}</p>
      {detail && <p className="metric-tile__detail">{detail}</p>}
    </Panel>
  )
}

export function TableFrame({ children, className = '', tableClassName = '', ariaLabel }: { children: ReactNode; className?: string; tableClassName?: string; ariaLabel?: string }) {
  return <Panel className={`table-frame ${className}`}><table aria-label={ariaLabel} className={`data-table ${tableClassName}`}>{children}</table></Panel>
}

export function FilterButton({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return <button className={`filter-chip${active ? ' active' : ''}`} onClick={onClick} type="button">{children}</button>
}
