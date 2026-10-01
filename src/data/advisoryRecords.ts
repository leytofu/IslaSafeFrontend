export type AdvisoryPriority = 'Critical' | 'Warning' | 'Info'

export interface AdvisoryRecord {
  id: string
  title: string
  target: string
  sent: string
  recipients: number
  priority: AdvisoryPriority
}

export const initialAdvisoryRecords: AdvisoryRecord[] = [
  { id: 'ADV-014', title: 'Typhoon AGHON: Signal No. 2', target: 'All barangays', sent: '25 min ago', recipients: 1247, priority: 'Critical' },
  { id: 'ADV-013', title: 'Storm surge rising — Lapinig coast', target: 'Coastal barangays', sent: '42 min ago', recipients: 438, priority: 'Warning' },
  { id: 'ADV-012', title: 'Evacuation centers are open', target: 'All barangays', sent: '1 hr ago', recipients: 1247, priority: 'Info' },
  { id: 'ADV-011', title: 'Travel advisory for Baud road', target: 'Baud, Pitogo', sent: '2 hrs ago', recipients: 365, priority: 'Warning' },
]
