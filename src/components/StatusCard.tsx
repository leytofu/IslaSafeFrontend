import type { LucideIcon } from 'lucide-react'
import './StatusCard.css'

type Tone = 'rose' | 'amber' | 'indigo' | 'blue'

interface StatusCardProps {
  label: string
  value: string
  change: string
  icon: LucideIcon
  tone: Tone
  onClick?: () => void
}

export function StatusCard({ label, value, change, icon: Icon, tone, onClick }: StatusCardProps) {
  return (
    <button className={`status-card status-card--${tone}`} onClick={onClick} type="button">
      <span className="status-card__orb" />
      <span className="status-card__row">
        <span>
          <span className="status-card__label">{label}</span>
          <span className="status-card__value">{value}</span>
        </span>
        <span className="status-card__icon"><Icon /></span>
      </span>
      <span className="status-card__change">{change}</span>
    </button>
  )
}
