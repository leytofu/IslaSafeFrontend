import { Siren } from 'lucide-react'
import './SosAlertOverlay.css'

/**
 * Full-screen SOS alert: a red flash over the entire interface with a
 * banner telling the admin how to acknowledge it. Rendered only while the
 * alarm is active and stops as soon as SOS Management is opened.
 */
export function SosAlertOverlay() {
  return (
    <div aria-live="assertive" className="sos-alert">
      <div className="sos-alert__banner">
        <span className="sos-alert__icon">
          <Siren />
        </span>
        <span>
          <strong className="sos-alert__title">Incoming SOS alert</strong>
          <span className="sos-alert__hint">Select SOS Management in the sidebar to acknowledge.</span>
        </span>
      </div>
    </div>
  )
}
