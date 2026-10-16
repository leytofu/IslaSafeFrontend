export const incidentTypes = ['Typhoon', 'Storm surge', 'Intense rains', 'Landslide', 'Strong winds', 'Others'] as const
export const incidentStatuses = ['Active', 'Monitoring', 'Responding', 'Resolved', 'Closed'] as const
export const incidentSeverities = ['Low', 'Moderate', 'High', 'Critical'] as const
export type IncidentType = typeof incidentTypes[number]
export type IncidentStatus = typeof incidentStatuses[number]
export type IncidentPeriod = 'week' | 'month' | 'year' | 'all'

export interface Incident {
  id: number
  type: IncidentType
  location: string
  severity: typeof incidentSeverities[number]
  status: IncidentStatus
  affected: string | null
  description: string | null
  reported_at: string
}

export interface IncidentStatistics {
  period: IncidentPeriod
  timezone: string
  from: string | null
  to: string
  total: number
  active: number
  resolved: number
  active_all: number
  breakdown: { type: IncidentType; count: number }[]
}

export function isActiveIncident(status: IncidentStatus) {
  return status === 'Active' || status === 'Monitoring' || status === 'Responding'
}
