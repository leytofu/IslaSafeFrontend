export type IncidentPeriod = 'Current' | 'Previous'

export interface IncidentRecord {
  id: string
  type: string
  location: string
  severity: string
  reported: string
  status: string
  affected: string
  period: IncidentPeriod
}

export const incidentRecords: IncidentRecord[] = [
  { id: 'INC-024', type: 'Typhoon', location: 'Coastal barangays', severity: 'High', reported: '6 min ago', status: 'Active', affected: '212 residents', period: 'Current' },
  { id: 'INC-023', type: 'Storm surge', location: 'Lapinig coast', severity: 'Critical', reported: '14 min ago', status: 'Active', affected: '87 residents', period: 'Current' },
  { id: 'INC-022', type: 'Intense rains', location: 'Pitogo proper', severity: 'Moderate', reported: '39 min ago', status: 'Monitoring', affected: '35 households', period: 'Current' },
  { id: 'INC-021', type: 'Landslide', location: 'Baud access road', severity: 'High', reported: '1 hr ago', status: 'Responding', affected: 'Road closed', period: 'Current' },
  { id: 'INC-020', type: 'Strong winds', location: 'San Vicente', severity: 'Moderate', reported: '2 hrs ago', status: 'Monitoring', affected: '16 homes', period: 'Current' },
  { id: 'INC-019', type: 'Storm surge', location: 'Lapinig coast', severity: 'High', reported: 'May 23, 4:20 PM', status: 'Resolved', affected: '31 residents', period: 'Previous' },
  { id: 'INC-018', type: 'Landslide', location: 'Baud access road', severity: 'High', reported: 'May 22, 11:05 AM', status: 'Resolved', affected: 'Road cleared', period: 'Previous' },
  { id: 'INC-017', type: 'Intense rains', location: 'San Vicente', severity: 'Moderate', reported: 'May 21, 8:40 PM', status: 'Closed', affected: '24 homes', period: 'Previous' },
  { id: 'INC-016', type: 'Strong winds', location: 'Tugas', severity: 'Moderate', reported: 'May 20, 2:15 PM', status: 'Resolved', affected: '18 homes', period: 'Previous' },
]
