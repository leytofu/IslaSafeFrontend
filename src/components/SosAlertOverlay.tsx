import { Siren } from 'lucide-react'

/**
 * Full-screen SOS alert: a red flash over the entire interface with a
 * banner telling the admin how to acknowledge it. Rendered only while the
 * alarm is active and stops as soon as SOS Management is opened.
 */
export function SosAlertOverlay() {
  return (
    <div aria-live="assertive" className="pointer-events-none fixed inset-0 z-50 sos-alert-flash">
      <div className="absolute bottom-5 left-1/2 flex w-[min(92vw,440px)] -translate-x-1/2 items-center gap-3 rounded-xl border border-rose-300/50 bg-rose-950/95 px-4 py-3 text-rose-50 shadow-2xl shadow-rose-950/70">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-500 text-white">
          <Siren className="size-5" />
        </span>
        <span>
          <strong className="block text-xs">Incoming SOS alert</strong>
          <span className="mt-0.5 block text-[10px] text-rose-100/75">Select SOS Management in the sidebar to acknowledge.</span>
        </span>
      </div>
    </div>
  )
}
