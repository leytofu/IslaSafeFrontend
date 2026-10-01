import { useState, type ReactElement } from 'react'
import './components/table.css'
import { DashboardPage } from './pages/DashboardPage'
import { Sidebar, type PageName } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { AuthPage } from './pages/AuthPage'
import { HazardMapPage } from './pages/HazardMapPage'
import { SosManagementPage } from './pages/SosManagementPage'
import { EvacuationCentersPage } from './pages/EvacuationCentersPage'
import { IncidentMonitoringPage } from './pages/IncidentMonitoringPage'
import { WeatherStationPage } from './pages/WeatherStationPage'
import { AdvisoriesPage } from './pages/AdvisoriesPage'
import { ResidentsPage } from './pages/ResidentsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SosAlertOverlay } from './components/SosAlertOverlay'
import { canManageSos, pagesForRole, type Role } from './config/roles'
import { useAuth } from './hooks/useAuth'
import { useSosRequests } from './hooks/useSosRequests'

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#050810] text-slate-100">
      <div className="text-center">
        <span className="mx-auto mb-4 block size-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Loading IslaSafe</p>
      </div>
    </div>
  )
}

function App() {
  const auth = useAuth()
  const [activePage, setActivePage] = useState<PageName>('Dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sosAlarmActive, setSosAlarmActive] = useState(false)
  const [isMapOnlyView, setIsMapOnlyView] = useState(false)
  const [selectedSosRequestId, setSelectedSosRequestId] = useState<string | null>(null)

  const role: Role = (auth.user?.role ?? 'residents') as Role
  const visiblePages = pagesForRole(role)
  const canManage = canManageSos(role)

  // Derived: fall back to the first page the role may open, so a role
  // change can never leave an inaccessible page on screen.
  const page: PageName = visiblePages.includes(activePage) ? activePage : visiblePages[0]

  const { requests: sosRequests, updateStatus, simulateIncomingSos } = useSosRequests({
    enabled: auth.status === 'authenticated',
    token: auth.token ?? '',
    canManage,
    onNewRequests: () => setSosAlarmActive(true),
  })

  const navigate = (page: PageName) => {
    setActivePage(page)
    setIsMapOnlyView(false)

    if (page !== 'SOS Management') {
      setSelectedSosRequestId(null)
    }

    // Opening the SOS Management nav item acknowledges the alarm.
    if (page === 'SOS Management') {
      setSosAlarmActive(false)
    }
  }

  const openSosRequest = (id: string) => {
    navigate('SOS Management')
    setSelectedSosRequestId(id)
  }

  if (auth.status === 'loading') {
    return <LoadingScreen />
  }

  if (auth.status === 'unauthenticated' || !auth.user) {
    return <AuthPage onRegister={auth.register} onSignIn={auth.signIn} />
  }

  const renderContent = () => {
    if (page === 'Dashboard') {
      return <DashboardPage onOpenMap={() => { setActivePage('Hazard Map'); setIsMapOnlyView(true) }} onOpenSosRequest={openSosRequest} sosRequests={sosRequests} />
    }

    if (page === 'Hazard Map') {
      return <HazardMapPage onMapOnlyChange={setIsMapOnlyView} />
    }

    const pages: Partial<Record<PageName, ReactElement>> = {
      'SOS Management': <SosManagementPage onClearSelectedRequest={() => setSelectedSosRequestId(null)} onIncomingSos={simulateIncomingSos} onUpdateStatus={updateStatus} requests={sosRequests} selectedRequestId={selectedSosRequestId} />,
      'Evacuation Centers': <EvacuationCentersPage />,
      'Incident Monitoring': <IncidentMonitoringPage />,
      'MDRRMO Link / AWS': <WeatherStationPage />,
      Advisories: <AdvisoriesPage />,
      Residents: <ResidentsPage />,
      'Reports & Analytics': <ReportsPage />,
      Settings: <SettingsPage />,
    }

    return pages[page] ?? null
  }

  const alertOverlay = sosAlarmActive ? <SosAlertOverlay /> : null

  if (isMapOnlyView) {
    return (
      <>
        <HazardMapPage mapOnly onMapOnlyChange={setIsMapOnlyView} />
        {alertOverlay}
      </>
    )
  }

  return (
    <>
      <div className="relative flex min-h-screen overflow-x-clip bg-[#050810] text-slate-100">
        <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(67,56,202,0.18),transparent_55%),radial-gradient(ellipse_65%_50%_at_100%_10%,rgba(14,116,144,0.12),transparent_56%),linear-gradient(180deg,#050810,#080d1a_45%,#050810)]" />
        <div className="pointer-events-none fixed inset-0 -z-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-size-[44px_44px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
        <Sidebar activePage={page} isOpen={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} onSignOut={auth.signOut} allowedPages={visiblePages} user={auth.user} />
        <main className="relative z-10 min-w-0 flex-1 pb-12 lg:ml-[264px]">
          <Topbar onOpenMenu={() => setMenuOpen(true)} page={page} />
          <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
        </main>
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-[#050810]/90 px-4 py-3 text-center text-[11px] text-slate-500 backdrop-blur-xl lg:left-[264px]">Developed by <span className="font-semibold text-slate-300">Four Sisters and a Wedding</span></footer>
      </div>
      {alertOverlay}
    </>
  )
}

export default App
