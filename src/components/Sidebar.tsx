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
    <section className="mb-5">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="space-y-1">
        {items.map(({ label, icon: Icon, badge, emphasis }) => {
          const isActive = label === activePage
          const isDanger = emphasis === 'danger'

          return (
            <button
              className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition ${
                isActive
                  ? isDanger
                    ? 'border-rose-400/45 bg-rose-500/15 text-white shadow-lg shadow-rose-950/30'
                    : 'border-indigo-400/35 bg-gradient-to-r from-indigo-500/20 to-blue-500/10 text-white shadow-lg shadow-indigo-950/25'
                  : isDanger
                    ? 'border-rose-400/25 bg-rose-500/8 text-slate-100 hover:border-rose-300/40 hover:bg-rose-500/15'
                    : 'border-transparent text-slate-400 hover:translate-x-0.5 hover:bg-white/5 hover:text-slate-100'
              }`}
              key={label}
              onClick={() => onNavigate(label)}
              type="button"
            >
              <Icon className={`size-[18px] ${isDanger ? 'text-rose-400' : isActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {badge && <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${isDanger ? 'bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.7)]' : 'bg-rose-500 text-white'}`}>{badge}</span>}
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
        className={`fixed inset-0 z-30 bg-slate-950/75 backdrop-blur-sm lg:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
        type="button"
      />
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] -translate-x-full flex-col border-r border-white/8 bg-[#090e1c]/95 px-4 py-5 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : ''}`}>
        <div className="mb-5 flex items-center gap-3 border-b border-white/8 px-2 pb-5">
          <div className="grid size-10 place-items-center rounded-xl border border-indigo-300/30 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-lg shadow-indigo-950/60">
            <Activity className="size-5 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">IslaSafe</p>
            <p className="mt-0.5 text-[9px] font-bold tracking-[0.18em] text-slate-500">MDRRMO PANEL</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
          <NavigationGroup activePage={activePage} items={visible(operationItems)} onNavigate={navigate} title="Operations" />
          <NavigationGroup activePage={activePage} items={visible(communicationItems)} onNavigate={navigate} title="Communication" />
          <NavigationGroup activePage={activePage} items={visible([{ label: 'Settings', icon: Settings }])} onNavigate={navigate} title="System" />
        </nav>

        <div className="mt-4 flex items-center gap-3 border-t border-white/8 px-2 pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-white/20 bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-bold text-white">{initials || 'U'}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-slate-100">{user.name}</span>
            <span className="block text-[10px] text-slate-500">{roleLabel}</span>
          </span>
          <button aria-label="Sign out" className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200" onClick={onSignOut} title="Sign out" type="button">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>
    </>
  )
}
