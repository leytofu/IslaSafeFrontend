import { useCallback, useEffect, useLayoutEffect, useState, type ReactElement } from 'react'
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
import type { HeaderResult } from './types/header'
import { HeaderResidentDialog } from './components/HeaderResidentDialog'

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
 * Drives the login → dashboard hand-off.
 * - `idle`: no sign-in in flight (also the state a restored session starts in).
 * - `attempt`: the login form submitted a sign-in; the login page is kept
 *   mounted so it can play its exit animation once authentication succeeds.
 * - `done`: the exit animation finished and the dashboard owns the screen.
 */
type AuthTransition = 'idle' | 'attempt' | 'done'

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
  const [isMapOnlyView, setIsMapOnlyView] = useState(false)
  const [selectedSosRequestId, setSelectedSosRequestId] = useState<string | null>(null)
  const [headerTarget, setHeaderTarget] = useState<{ sessionKey: string; result: HeaderResult } | null>(null)
  const [resetRequest, setResetRequest] = useState<ResetRequest | null>(readResetRequest)
  // Login → dashboard hand-off; see AuthTransition.
  const [authTransition, setAuthTransition] = useState<AuthTransition>('idle')
  // Bumped when the profile button is clicked so SettingsPage remounts on the Profile tab.
  const [settingsTabKey, setSettingsTabKey] = useState(0)
  // Sidebar collapse state (toggled by tapping the logo) — persisted so the
  // preference survives a refresh.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('islasafe.sidebar.collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem('islasafe.sidebar.collapsed', String(next))
      } catch {
        // Storage unavailable — state still works for this session.
      }
      return next
    })
  }

  // VS Code-style Ctrl+B shortcut to toggle the sidebar (desktop only).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarCollapsed((current) => {
          const next = !current
          try {
            window.localStorage.setItem('islasafe.sidebar.collapsed', String(next))
          } catch {
            // Storage unavailable — state still works for this session.
          }
          return next
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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

  const { requests: sosRequests, updateStatus, unreadCount, pendingCount, acknowledgeRequests, loading: sosLoading, error: sosError, updatedAt: sosUpdatedAt, refresh: refreshSos } = useSosRequests({
    enabled: auth.status === 'authenticated',
    sessionKey: auth.sessionKey ?? '',
    canManage,
    accountId: auth.user?.id ?? null,
  })

  const navigate = (page: PageName) => {
    setHeaderTarget(null)
    setActivePage(page)
    setIsMapOnlyView(false)

    if (page !== 'SOS Management') {
      setSelectedSosRequestId(null)
    }

    // Opening the SOS Management nav item acknowledges the alarm.
    if (page === 'SOS Management') {
      acknowledgeRequests()
    }
  }

  // The lower-left profile button jumps straight to Settings → Profile,
  // even if another settings tab was previously open.
  const openProfile = () => {
    setSettingsTabKey((k) => k + 1)
    navigate('Settings')
  }

  const openSosRequest = (id: string) => {
    navigate('SOS Management')
    setSelectedSosRequestId(id)
  }

  const openHeaderRecord = (result: HeaderResult) => {
    if (result.kind === 'sos') { openSosRequest(result.id); return }
    if (result.kind === 'incident') navigate('Incident Monitoring')
    if (result.kind === 'center') navigate('Evacuation Centers')
    setHeaderTarget({ sessionKey: auth.sessionKey ?? '', result })
  }
  const selectedHeaderRecord = headerTarget?.sessionKey === auth.sessionKey ? headerTarget.result : null

  const authenticated = auth.status === 'authenticated' && Boolean(auth.user)
  const loadingSession = auth.status === 'loading'
  // The login page stays mounted while a sign-in is in flight and for the whole
  // hand-off that follows a successful one, so it can animate away instead of
  // being replaced by a hard cut. Restored sessions never enter this path.
  const showAuth = resetRequest ? true : !loadingSession && (!authenticated || authTransition === 'attempt')
  // True only while the dashboard is already mounted behind the login page.
  const overlayAuth = authenticated && authTransition === 'attempt' && showAuth && !resetRequest
  // Entrance animation for the dashboard; a restored session skips it.
  const enterDashboard = authenticated && authTransition !== 'idle'

  const beginSignIn = useCallback(() => setAuthTransition('attempt'), [])
  const finishSignInTransition = useCallback(() => setAuthTransition('done'), [])

  useLayoutEffect(() => {
    // The login page pins itself above the dashboard; park the document at the
    // top in the same frame so nothing shifts while both views overlap.
    if (overlayAuth) window.scrollTo(0, 0)
  }, [overlayAuth])

  const renderContent = () => {
    if (page === 'Dashboard') {
      return <DashboardPage sessionKey={auth.sessionKey ?? ''} onOpenMap={() => { setActivePage('Hazard Map'); setIsMapOnlyView(true) }} onOpenSosRequest={openSosRequest} onOpenSosManagement={() => navigate('SOS Management')} onOpenAdvisories={() => navigate('Advisories')} onOpenIncidents={() => navigate('Incident Monitoring')} sosRequests={sosRequests} />
    }

    if (page === 'Hazard Map') {
      return <HazardMapPage sessionKey={auth.sessionKey ?? ''} onMapOnlyChange={setIsMapOnlyView} />
    }

    const pages: Partial<Record<PageName, ReactElement>> = {
      'SOS Management': <SosManagementPage onClearSelectedRequest={() => setSelectedSosRequestId(null)} onRefresh={refreshSos} loading={sosLoading} error={sosError} updatedAt={sosUpdatedAt} onUpdateStatus={updateStatus} requests={sosRequests} selectedRequestId={selectedSosRequestId} />,
      'Evacuation Centers': <EvacuationCentersPage sessionKey={auth.sessionKey ?? ''} initialCenterId={selectedHeaderRecord?.kind === 'center' ? Number(selectedHeaderRecord.id) : null} onClearInitial={() => setHeaderTarget(null)} />,
      'Incident Monitoring': <IncidentMonitoringPage sessionKey={auth.sessionKey ?? ''} initialIncidentId={selectedHeaderRecord?.kind === 'incident' ? Number(selectedHeaderRecord.id) : null} onClearInitial={() => setHeaderTarget(null)} />,
      'MDRRMO Link / AWS': <WeatherStationPage />,
      Advisories: <AdvisoriesPage key={auth.sessionKey} sessionKey={auth.sessionKey ?? ''} />,
      Residents: <ResidentsPage />,
      'Reports & Analytics': <ReportsPage />,
      Settings: <SettingsPage key={settingsTabKey} sessionKey={auth.sessionKey ?? ''} onSaveProfile={auth.updateProfile} user={auth.user} />,
    }

    return pages[page] ?? null
  }

  const alertOverlay = unreadCount > 0 ? <SosAlertOverlay count={unreadCount} onOpenSos={() => navigate('SOS Management')} /> : null

  const renderShell = (user: NonNullable<typeof auth.user>) => {
    if (isMapOnlyView) {
      return (
        <>
          <HazardMapPage sessionKey={auth.sessionKey ?? ''} mapOnly onMapOnlyChange={setIsMapOnlyView} />
          {alertOverlay}
        </>
      )
    }

    return (
      <>
        <div className={`app-shell${sidebarCollapsed ? ' app-shell--collapsed' : ''}`}>
          <div className="app-shell__bg app-shell__bg--glow" />
          <div className="app-shell__bg app-shell__bg--grid" />
          <Sidebar sosCount={pendingCount} activePage={page} collapsed={sidebarCollapsed} isOpen={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} onOpenProfile={openProfile} onSignOut={auth.signOut} onToggleCollapse={toggleSidebar} allowedPages={visiblePages} user={user} />
          <main className="app-main">
            <Topbar key={auth.sessionKey} onOpenMenu={() => setMenuOpen(true)} page={page} sessionKey={auth.sessionKey ?? ''} onOpenRecord={openHeaderRecord} />
            <div className="app-content">{renderContent()}</div>
          </main>
          <footer className="app-footer"><div>© 2026 IslaSafe. All rights reserved.</div><div>Developed by <span>Four Sisters and a wedding.</span></div></footer>
        </div>
        {alertOverlay}
        {selectedHeaderRecord?.kind === 'resident' && <HeaderResidentDialog resident={selectedHeaderRecord} onClose={() => setHeaderTarget(null)} />}
      </>
    )
  }

  return (
    <div className="app-view">
      {/* The stage holds the signed-in app; the login page floats above it until
          its exit animation finishes. Both slots keep a stable position so
          neither view remounts mid-transition. */}
      <div className={`app-stage${enterDashboard ? ' app-stage--entering' : ''}`}>
        {resetRequest ? null : loadingSession ? <LoadingScreen /> : authenticated && auth.user ? renderShell(auth.user) : null}
      </div>
      {showAuth && (
        <AuthPage
          onClearReset={clearResetRequest}
          onExitComplete={finishSignInTransition}
          onSignIn={auth.signIn}
          onSignInStart={beginSignIn}
          overlay={overlayAuth}
          resetRequest={resetRequest}
        />
      )}
    </div>
  )
}

export default App
