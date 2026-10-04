import { Bell, Menu, Search, Sun } from 'lucide-react'
import type { PageName } from './Sidebar'
import './Topbar.css'

interface TopbarProps {
  page: PageName
  onOpenMenu: () => void
}

const pageDescriptions: Partial<Record<PageName, string>> = {
  Dashboard: "Welcome back — here's what is happening across CPG Island today.",
  'Hazard Map': 'Monitor active zones, evacuation centers, and response markers.',
  'SOS Management': 'Coordinate incoming calls for emergency assistance.',
}

export function Topbar({ page, onOpenMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button aria-label="Open navigation" className="topbar__menu" onClick={onOpenMenu} type="button">
        <Menu />
      </button>
      <div className="topbar__heading">
        <h1 className="topbar__title">{page}</h1>
        <p className="topbar__subtitle">{pageDescriptions[page] ?? 'Coordinate response operations from one secure workspace.'}</p>
      </div>

      <label className="topbar__search">
        <Search className="topbar__search-icon" />
        <input className="topbar__search-input" placeholder="Search residents, SOS ID, barangay..." />
      </label>

      <div className="topbar__clock">
        <p className="topbar__clock-time">09:41 AM</p>
        <p>Sat, May 25, 2024</p>
      </div>
      <button aria-label="Toggle theme" className="topbar__icon-button" type="button">
        <Sun />
      </button>
      <button aria-label="View notifications" className="topbar__icon-button" type="button">
        <Bell />
        <span className="topbar__notification-dot" />
      </button>
    </header>
  )
}
