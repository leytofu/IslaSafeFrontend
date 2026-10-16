import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { HeaderSearch } from './HeaderSearch'
import { HeaderNotifications } from './HeaderNotifications'
import { LiveClock } from './LiveClock'
import type { HeaderResult } from '../types/header'
import type { PageName } from './Sidebar'
import './Topbar.css'

interface TopbarProps {
  page: PageName
  onOpenMenu: () => void
  sessionKey: string
  onOpenRecord: (result: HeaderResult) => void
}

const pageDescriptions: Partial<Record<PageName, string>> = {
  Dashboard: "Welcome back — here's what is happening across CPG Island today.",
  'Hazard Map': 'Monitor active zones, evacuation centers, and response markers.',
  'SOS Management': 'Coordinate incoming calls for emergency assistance.',
}

export function Topbar({ page, onOpenMenu, sessionKey, onOpenRecord }: TopbarProps) {
  return (
    <header className="topbar">
      <button aria-label="Open navigation" className="topbar__menu" onClick={onOpenMenu} type="button">
        <Menu />
      </button>
      <div className="topbar__heading">
        <h1 className="topbar__title">{page}</h1>
        <p className="topbar__subtitle">{pageDescriptions[page] ?? 'Coordinate response operations from one secure workspace.'}</p>
      </div>

      <HeaderSearch sessionKey={sessionKey} onSelect={onOpenRecord} />
      <LiveClock />
      <ThemeToggle />
      <HeaderNotifications sessionKey={sessionKey} onSelect={onOpenRecord} />
    </header>
  )
}
