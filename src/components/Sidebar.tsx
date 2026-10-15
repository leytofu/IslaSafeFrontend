import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CloudSun,
  LayoutDashboard,
  LogOut,
  Map,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { isRole, roleLabels } from '../config/roles'
import './Sidebar.css'

export type PageName =
  | 'Dashboard'
  | 'SOS Management'
  | 'Hazard Map'
  | 'Evacuation Centers'
  | 'Incident Monitoring'
  | 'MDRRMO Link / AWS'
  | 'Advisories'
  | 'Residents'
  | 'Reports & Analytics'
  | 'Settings'

type NavItem = {
  label: PageName
  icon: LucideIcon
  badge?: string
  emphasis?: 'danger'
}

const operationItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'SOS Management', icon: BellRing, emphasis: 'danger' },
  { label: 'Hazard Map', icon: Map },
  { label: 'Evacuation Centers', icon: ShieldCheck },
  { label: 'Incident Monitoring', icon: AlertTriangle, badge: '8' },
  { label: 'MDRRMO Link / AWS', icon: CloudSun },
]

const communicationItems: NavItem[] = [
  { label: 'Advisories', icon: Megaphone },
  { label: 'Residents', icon: Users },
  { label: 'Reports & Analytics', icon: BarChart3 },
]

interface SidebarUser {
  name: string
  role: string
  avatar_url: string | null
}

interface SidebarProps {
  sosCount: number
  activePage: PageName
  allowedPages: PageName[]
  collapsed: boolean
  isOpen: boolean
  user: SidebarUser
  onClose: () => void
  onNavigate: (page: PageName) => void
  onOpenProfile: () => void
  onSignOut: () => void
  onToggleCollapse: () => void
}

function NavigationGroup({
  title,
  items,
  activePage,
  collapsed,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  activePage: PageName
  collapsed: boolean
  onNavigate: (page: PageName) => void
}) {
  return (
    <section className="nav-group">
      <p className="nav-group__title">{title}</p>
      <div className="stack-1">
        {items.map(({ label, icon: Icon, badge, emphasis }) => {
          const isActive = label === activePage
          const isDanger = emphasis === 'danger'

          return (
            <button
              className={`nav-item${isActive ? ' is-active' : ''}${isDanger ? ' is-danger' : ''}`}
              key={label}
              onClick={() => onNavigate(label)}
              // Collapsed rail hides the label — the title keeps it discoverable.
              title={collapsed ? label : undefined}
              type="button"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="nav-item__icon" />
              <span className="nav-item__label">{label}</span>
              {badge && <span className="nav-item__badge">{badge}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function Sidebar({ sosCount, activePage, allowedPages, collapsed, isOpen, user, onClose, onNavigate, onOpenProfile, onSignOut, onToggleCollapse }: SidebarProps) {
  const navigate = (page: PageName) => {
    onNavigate(page)
    onClose()
  }

  const drawer = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const changed = () => setDesktop(media.matches)
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [])
  useEffect(() => {
    if (desktop || !isOpen) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawer.current?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus({ preventScroll: true })
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab') return
      const buttons = [...(drawer.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]') ?? [])].filter((item) => item.getClientRects().length)
      const first = buttons[0]; const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus({ preventScroll: true }) }
  }, [desktop, isOpen])
  const visible = (items: NavItem[]) => items.filter(({ label }) => allowedPages.includes(label))
  const roleLabel = isRole(user.role) ? roleLabels[user.role] : roleLabels.residents
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <button
        aria-label="Close navigation"
        tabIndex={isOpen ? 0 : -1}
        className={`sidebar-scrim${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
        type="button"
      />
      <aside ref={drawer} inert={!desktop && !isOpen} aria-hidden={!desktop && !isOpen ? true : undefined} role={!desktop && isOpen ? 'dialog' : undefined} aria-modal={!desktop && isOpen ? true : undefined} aria-label="Main navigation" className={`sidebar${isOpen ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
        <div className="sidebar__brand">
          {/* The logo controls navigation size; the brand text opens home. */}
          <button
            aria-expanded={desktop ? !collapsed : isOpen}
            aria-label={desktop ? (collapsed ? 'Expand navigation using logo' : 'Collapse navigation using logo') : 'Close navigation using logo'}
            className="sidebar__logo-btn"
            onClick={desktop ? onToggleCollapse : onClose}
            title={desktop ? (collapsed ? 'Expand navigation' : 'Collapse navigation') : 'Close navigation'}
            type="button"
          >
            <img className="sidebar__logo-image" src="/app-logo.png" alt="" />
          </button>
          <button aria-label="Go to dashboard" className="sidebar__brand-text" inert={desktop && collapsed} onClick={() => navigate('Dashboard')} title="Dashboard" type="button">
            <span className="sidebar__brand-name">IslaSafe</span>
            <span className="sidebar__brand-tag">MDRRMO PANEL</span>
          </button>
          <button aria-label="Close navigation menu" className="sidebar__mobile-close" onClick={onClose} type="button"><X /></button>
        </div>

        <nav className="sidebar__nav">
          <NavigationGroup activePage={activePage} collapsed={collapsed} items={visible(operationItems).map(item => item.label === 'SOS Management' ? { ...item, badge: sosCount > 0 ? String(sosCount) : undefined } : item)} onNavigate={navigate} title="Operations" />
          <NavigationGroup activePage={activePage} collapsed={collapsed} items={visible(communicationItems)} onNavigate={navigate} title="Communication" />
          <NavigationGroup activePage={activePage} collapsed={collapsed} items={visible([{ label: 'Settings', icon: Settings }])} onNavigate={navigate} title="System" />
        </nav>

        <div className="sidebar__user">
          <button
            aria-label="Open profile settings"
            className="sidebar__user-btn"
            onClick={() => { onOpenProfile(); onClose() }}
            title={collapsed ? `${user.name} · ${roleLabel} — Open profile` : 'Open profile settings'}
            type="button"
          >
            <span className="sidebar__user-avatar">
              {/* Initials sit underneath as a permanent fallback — if the
                   photo fails to load (or is missing) they show through. */}
              {initials || 'U'}
              {user.avatar_url && (
                <img
                  alt=""
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                  src={user.avatar_url}
                />
              )}
            </span>
            <span className="sidebar__user-meta">
              <span className="sidebar__user-name">{user.name}</span>
              <span className="sidebar__user-role">{roleLabel}</span>
            </span>
          </button>
          <button aria-label="Sign out" className="sidebar__signout" onClick={onSignOut} title="Sign out" type="button">
            <LogOut />
          </button>
        </div>
      </aside>
    </>
  )
}
