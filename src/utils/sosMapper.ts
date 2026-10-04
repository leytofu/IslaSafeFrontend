import { HeartPulse, Waves, type LucideIcon } from 'lucide-react'
import type { SosCategory, SosPeriod, SosRequest, SosStatus } from '../data/sosRequests'

export interface ApiSosRecord {
  id: string
  name: string
  contact: string
  location: string
  latitude: number
  longitude: number
  type: string
  category: SosCategory
  priority: 'Critical' | 'High' | 'Medium'
  description: string
  status: SosStatus
  received_at: string
}

const categoryStyles: Record<SosCategory, { color: string; icon: LucideIcon }> = {
  Medical: { color: 'sos-tile--medical', icon: HeartPulse },
  'Flood assistance': { color: 'sos-tile--flood', icon: Waves },
  Evacuation: { color: 'sos-tile--evacuation', icon: HeartPulse },
}

function startOfDay(date: Date): number {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}

function daysAgo(receivedAt: Date): number {
  return Math.round((startOfDay(new Date()) - startOfDay(receivedAt)) / 86_400_000)
}

function derivePeriod(receivedAt: Date): SosPeriod {
  const days = daysAgo(receivedAt)
  if (days <= 0) return 'today'
  if (days <= 7) return 'last-week'
  return 'last-month'
}

function formatReceived(receivedAt: Date): string {
  const days = daysAgo(receivedAt)
  if (days <= 0) {
    return `Today at ${receivedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

/**
 * Translate a backend record into the SosRequest shape the UI renders
 * (adds coordinates pair, display styling, and human-readable time fields).
 */
export function toSosRequest(record: ApiSosRecord): SosRequest {
  const receivedAt = new Date(record.received_at)
  const style = categoryStyles[record.category] ?? categoryStyles.Medical

  return {
    id: record.id,
    name: record.name,
    contact: record.contact,
    location: record.location,
    coordinates: [record.latitude, record.longitude],
    type: record.type,
    category: record.category,
    priority: record.priority,
    description: record.description,
    period: derivePeriod(receivedAt),
    received: formatReceived(receivedAt),
    status: record.status,
    color: style.color,
    icon: style.icon,
  }
}
