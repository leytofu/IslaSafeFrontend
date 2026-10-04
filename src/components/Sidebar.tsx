import {
  Activity,
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
}

interface SidebarProps {
  activePage: PageName
  allowedPages: PageName[]
  isOpen: boolean
  user: SidebarUser
  onClose: () => void
  onNavigate: (page: PageName) => void
  onSignOut: () => void
}

function NavigationGroup({
  title,
  items,
  activePage,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  activePage: PageName
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

export function Sidebar({ activePage, allowedPages, isOpen, user, onClose, onNavigate, onSignOut }: SidebarProps) {
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
      <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon">
            <Activity strokeWidth={2.4} />
          </div>
          <div>
            <p className="sidebar__brand-name">IslaSafe</p>
            <p className="sidebar__brand-tag">MDRRMO PANEL</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <NavigationGroup activePage={activePage} items={visible(operationItems)} onNavigate={navigate} title="Operations" />
          <NavigationGroup activePage={activePage} items={visible(communicationItems)} onNavigate={navigate} title="Communication" />
          <NavigationGroup activePage={activePage} items={visible([{ label: 'Settings', icon: Settings }])} onNavigate={navigate} title="System" />
        </nav>

        <div className="sidebar__user">
          <span className="sidebar__user-avatar">{initials || 'U'}</span>
          <span className="sidebar__user-meta">
            <span className="sidebar__user-name">{user.name}</span>
            <span className="sidebar__user-role">{roleLabel}</span>
          </span>
          <button aria-label="Sign out" className="sidebar__signout" onClick={onSignOut} title="Sign out" type="button">
            <LogOut />
          </button>
        </div>
      </aside>
    </>
  )
}
