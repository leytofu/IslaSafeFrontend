import { useState, type ReactElement } from 'react'
import './components/table.css'
import './App.css'
import { DashboardPage } from './pages/DashboardPage'
import { Sidebar, type PageName } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { AuthPage, type ResetRequest } from './pages/AuthPage'
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
    <div className="loading-screen">
      <div className="loading-screen__inner">
        <span className="loading-screen__spinner is-spinning" />
        <p className="loading-screen__label">Loading IslaSafe</p>
      </div>
    </div>
  )
}

/**
 * Detects the emailed password-reset link (/reset-password?token=...&email=...).
 * Returns an object (possibly with empty fields so the UI can explain that the
 * link is incomplete) whenever the path matches, null otherwise.
 */
function readResetRequest(): ResetRequest | null {
  try {
    const path = window.location.pathname.replace(/\/+$/, '') || '/'
    if (path !== '/reset-password') return null
    const params = new URLSearchParams(window.location.search)
    return {
      token: (params.get('token') ?? '').trim(),
      email: (params.get('email') ?? '').trim(),
    }
  } catch {
    return null
  }
}

function App() {
  const auth = useAuth()
  const [activePage, setActivePage] = useState<PageName>('Dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sosAlarmActive, setSosAlarmActive] = useState(false)
  const [isMapOnlyView, setIsMapOnlyView] = useState(false)
  const [selectedSosRequestId, setSelectedSosRequestId] = useState<string | null>(null)
  const [resetRequest, setResetRequest] = useState<ResetRequest | null>(readResetRequest)

  // Leaves the reset-password URL so a refresh lands back on the normal app.
  const clearResetRequest = () => {
    window.history.replaceState({}, '', '/')
    setResetRequest(null)
  }

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

  // A password-reset link wins over every other view — the user may not even
  // be signed in (or may have an old session) when they open it.
  if (resetRequest) {
    return <AuthPage onClearReset={clearResetRequest} onRegister={auth.register} onSignIn={auth.signIn} resetRequest={resetRequest} />
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
      <div className="app-shell">
        <div className="app-shell__bg app-shell__bg--glow" />
        <div className="app-shell__bg app-shell__bg--grid" />
        <Sidebar activePage={page} isOpen={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} onSignOut={auth.signOut} allowedPages={visiblePages} user={auth.user} />
        <main className="app-main">
          <Topbar onOpenMenu={() => setMenuOpen(true)} page={page} />
          <div className="app-content">{renderContent()}</div>
        </main>
        <footer className="app-footer">Developed by <span>Four Sisters and a Wedding</span></footer>
      </div>
      {alertOverlay}
    </>
  )
}

export default App
