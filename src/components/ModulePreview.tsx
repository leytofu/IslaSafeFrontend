import { ArrowUpRight, CircleCheckBig, Clock3, FileText, type LucideIcon } from 'lucide-react'
import type { PageName } from './Sidebar'
import './ModulePreview.css'

const descriptions: Partial<Record<PageName, string>> = {
  'SOS Management': 'Prioritize and coordinate live emergency requests reported by residents.',
  'Evacuation Centers': 'Monitor operational capacity and availability across registered centers.',
  'Incident Monitoring': 'Review current incident reports and response statuses.',
  'MDRRMO Link / AWS': 'View the latest weather station and regional monitoring signals.',
  Advisories: 'Prepare and distribute official notices to affected barangays.',
  Residents: 'Maintain verified resident records and household information.',
  'Reports & Analytics': 'Review operational trends and export formal response reports.',
  Settings: 'Manage dashboard preferences and system configuration.',
}

interface ModulePreviewProps {
  icon: LucideIcon
  page: Exclude<PageName, 'Dashboard' | 'Hazard Map'>
}

export function ModulePreview({ icon: Icon, page }: ModulePreviewProps) {
  return (
    <div className="module-preview">
      <section className="module-preview__panel panel">
        <div className="module-preview__hero">
          <span className="module-preview__icon"><Icon /></span>
          <h2 className="module-preview__title">{page}</h2>
          <p className="module-preview__description">{descriptions[page]}</p>
        </div>
        <div className="module-preview__grid">
          {[
            ['Live operational view', 'Connected to dashboard data', CircleCheckBig],
            ['Response queue', 'Prioritized by urgency', Clock3],
            ['Activity records', 'Latest updates and exports', FileText],
          ].map(([title, detail, CardIcon]) => {
            const CardIconComponent = CardIcon as LucideIcon
            return <button className="module-preview__card" key={title as string} type="button"><CardIconComponent /><p className="module-preview__card-title">{title as string}</p><p className="module-preview__card-detail">{detail as string}</p><ArrowUpRight className="module-preview__card-arrow" /></button>
          })}
        </div>
      </section>
    </div>
  )
}
