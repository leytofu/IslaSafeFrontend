export type HeaderRecordKind = 'sos' | 'incident' | 'center' | 'resident'
export interface HeaderResult {
  kind: HeaderRecordKind
  id: string
  title: string
  subtitle: string
  status?: string
  details?: { label: string; value: string }[]
}
export interface HeaderNotification extends HeaderResult {
  key: string
  occurred_at: string
  read: boolean
}
export interface NotificationResponse { data: HeaderNotification[]; unread_count: number }
