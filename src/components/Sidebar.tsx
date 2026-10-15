import {
  AlertTriangle,
  BarChart3,
  BellRing,
  ChevronsLeft,
  ChevronsRight,
  CloudSun,
  LayoutDashboard,
  LogOut,
  Map,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
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
  { label: 'SOS Management', icon: BellRing, badge: '12', emphasis: 'danger' },
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

export function Sidebar({ activePage, allowedPages, collapsed, isOpen, user, onClose, onNavigate, onOpenProfile, onSignOut, onToggleCollapse }: SidebarProps) {
  const navigate = (page: PageName) => {
    onNavigate(page)
    onClose()
  }

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
        className={`sidebar-scrim${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
        type="button"
      />
      <aside className={`sidebar${isOpen ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
        <div className="sidebar__brand">
          {/* The logo navigates home to the Dashboard. */}
          <button
            aria-label="Go to dashboard"
            className="sidebar__logo-btn"
            onClick={() => navigate('Dashboard')}
            title="Dashboard"
            type="button"
          >
            <img className="sidebar__logo-image" src="/app-logo.png" alt="" />
          </button>
          <span className="sidebar__brand-text">
            <span className="sidebar__brand-name">IslaSafe</span>
            <span className="sidebar__brand-tag">MDRRMO PANEL</span>
          </span>
          {/* Collapse toggle glides: inline-right when expanded,
              centered under the logo when collapsed. */}
          <button
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="sidebar__collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand navigation (Ctrl+B)' : 'Collapse navigation (Ctrl+B)'}
            type="button"
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </button>
        </div>

        <nav className="sidebar__nav">
          <NavigationGroup activePage={activePage} collapsed={collapsed} items={visible(operationItems)} onNavigate={navigate} title="Operations" />
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
