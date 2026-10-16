export type AdvisoryPriority = 'Critical' | 'Warning' | 'Info'
export interface AdvisoryRecord {
  id: number
  title: string
  message: string
  target: string
  priority: AdvisoryPriority
  status: 'Active' | 'Archived'
  published_at: string
  updated_at: string
}
export function advisoryDate(value: string) {
  return new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
