export interface SosInbox {
  initialized: boolean
  seenIds: string[]
  unreadIds: string[]
}
export const emptySosInbox = (): SosInbox => ({ initialized: false, seenIds: [], unreadIds: [] })

export function readSosInbox(raw: string | null): SosInbox | null {
  try {
    const value = JSON.parse(raw ?? 'null') as SosInbox | null
    if (!value || typeof value.initialized !== 'boolean' || !Array.isArray(value.seenIds) || !Array.isArray(value.unreadIds)) return null
    if (![...value.seenIds, ...value.unreadIds].every(id => typeof id === 'string')) return null
    return { initialized: value.initialized, seenIds: [...new Set(value.seenIds)], unreadIds: [...new Set(value.unreadIds)] }
  } catch { return null }
}

/** Keep an incoming alarm until explicit review, even if its status changes. */
export function receiveSosInbox(inbox: SosInbox, records: { id: string; status: string }[]): SosInbox {
  const seen = new Set(inbox.seenIds)
  const currentIds = new Set(records.map(record => record.id))
  const unread = new Set(inbox.unreadIds.filter(id => currentIds.has(id)))
  for (const record of records) {
    if (!seen.has(record.id) && (inbox.initialized || record.status !== 'Resolved')) unread.add(record.id)
    seen.add(record.id)
  }
  return { initialized: true, seenIds: [...seen], unreadIds: [...unread] }
}
export function acknowledgeSosInbox(inbox: SosInbox): SosInbox {
  return { ...inbox, unreadIds: [] }
}
