import type { LucideIcon } from 'lucide-react'

export type SosCategory = 'Medical' | 'Flood assistance' | 'Evacuation'
export type SosPeriod = 'today' | 'last-week' | 'last-month'
export type SosStatus = 'Pending' | 'Coming' | 'Resolved'

export interface SosRequest {
  id: string
  name: string
  contact: string
  location: string
  coordinates: [number, number]
  type: string
  category: SosCategory
  priority: 'Critical' | 'High' | 'Medium'
  description: string
  period: SosPeriod
  received: string
  status: SosStatus
  color: string
  icon: LucideIcon
}
