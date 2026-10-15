import { Siren } from 'lucide-react'
import './SosAlertOverlay.css'

/**
 * Full-screen SOS alert: a red flash over the entire interface with a
 * banner telling the admin how to acknowledge it. Rendered only while the
 * alarm is active and stops as soon as SOS Management is opened.
 */
export function SosAlertOverlay({ count, onOpenSos }: { count: number; onOpenSos: () => void }) {
  return (
    <div role="alert" aria-live="assertive" className="sos-alert" data-testid="sos-alert">
      <div className="sos-alert__banner">
        <span className="sos-alert__icon">
          <Siren />
        </span>
        <span>
          <strong className="sos-alert__title">{count} unreviewed SOS {count === 1 ? 'request' : 'requests'}</strong>
          <span className="sos-alert__hint">Open SOS Management to review and stop this alert.</span>
        </span>
        <button className="sos-alert__open" onClick={onOpenSos} type="button">Open SOS Management</button>
      </div>
    </div>
  )
}
