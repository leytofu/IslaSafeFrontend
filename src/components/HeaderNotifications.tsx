import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, RefreshCw, Siren, TriangleAlert } from 'lucide-react'
import { useHeaderNotifications } from '../hooks/useHeaderNotifications'
import type { HeaderResult } from '../types/header'

export function HeaderNotifications({ sessionKey, onSelect }: { sessionKey: string; onSelect: (item: HeaderResult) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const notifications = useHeaderNotifications(sessionKey)
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  return <div className="header-notifications" ref={root} onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }} onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); event.stopPropagation() } }}>
    <button ref={trigger} aria-label={`View notifications${notifications.unread_count ? `, ${notifications.unread_count} unread` : ''}`} aria-expanded={open} aria-controls="header-notifications-panel" className="topbar__icon-button" type="button" onClick={() => { setOpen((value) => !value); if (!open) void notifications.refresh() }}>
      <Bell aria-hidden="true" />{notifications.unread_count > 0 && <span className="header-notifications__badge" aria-hidden="true">{notifications.unread_count}</span>}
    </button>
    {open && <section className="header-popover header-notifications__popover" id="header-notifications-panel" aria-label="Notifications">
      <div className="header-popover__heading"><strong>Notifications</strong><button className="table-icon-button" aria-label="Refresh notifications" onClick={() => void notifications.refresh()} type="button"><RefreshCw /></button></div>
      <div className="header-notifications__toolbar"><span>{notifications.unread_count} unread</span><button className="header-text-button" disabled={notifications.saving || !notifications.unread_count} onClick={() => void notifications.markRead(notifications.data.filter((item) => !item.read).map((item) => item.key))} type="button"><CheckCheck aria-hidden="true" />{notifications.saving ? 'Saving…' : 'Mark all as read'}</button></div>
      {notifications.error && <p className="header-popover__error" role="alert">{notifications.error}</p>}
      {notifications.loading ? <p className="header-popover__hint" role="status">Loading notifications…</p> : !notifications.data.length && !notifications.error ? <p className="header-popover__hint">No recent SOS or incident activity.</p> : <ul className="header-result-list">{notifications.data.map((item) => {
        const Icon = item.kind === 'sos' ? Siren : TriangleAlert
        return <li className={`header-result${item.read ? '' : ' is-unread'}`} key={item.key}><button type="button" onClick={() => { if (!item.read) void notifications.markRead([item.key]); setOpen(false); onSelect(item) }}><Icon className="header-result__icon" aria-hidden="true" /><span className="header-result__content"><span className="header-result__title">{item.title}</span><span className="header-result__detail">{item.subtitle}</span><time className="header-result__kind" dateTime={item.occurred_at}>{new Date(item.occurred_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · PHT{item.read ? ' · Read' : ' · Unread'}</time></span></button></li>
      })}</ul>}
      <p className="header-popover__hint header-popover__footnote">Latest 20 SOS and 20 incident updates · Refreshes every 15s. Reading a notification does not acknowledge the SOS alarm.</p>
    </section>}
  </div>
}
