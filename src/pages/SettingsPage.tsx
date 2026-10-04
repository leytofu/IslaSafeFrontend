import { useState, type ReactNode } from 'react'
import { BellRing, Settings2, ShieldAlert, Users } from 'lucide-react'
import { Panel, SectionHeading, StatusPill } from '../components/Primitives'
import './SettingsPage.css'

const settingsTabs = [
  { label: 'Profile', icon: Users }, { label: 'Account & security', icon: ShieldAlert }, { label: 'Notifications', icon: BellRing },
  { label: 'System config', icon: Settings2 }, { label: 'Team & roles', icon: Users },
]

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span className="field__label">{label}</span><span className="field-control">{children}</span></label>
}

function SettingsRows({ rows, title }: { rows: Array<[string, string, string]>; title: string }) {
  return <><SectionHeading title={title} /><div>{rows.map(([label, detail, action]) => <div className="settings-row" key={label}><div><p className="settings-row__label">{label}</p><p className="settings-row__detail">{detail}</p></div>{action === 'toggle' ? <button aria-label={`Toggle ${label}`} className="settings-toggle" type="button" /> : ['Connected', 'Active', 'Owner'].includes(action) ? <StatusPill tone="success">{action}</StatusPill> : <button className="action-button" type="button">{action}</button>}</div>)}</div></>
}

export function SettingsPage() {
  const [active, setActive] = useState('Profile')
  const content: Record<string, ReactNode> = {
    Profile: <><SectionHeading title="Profile information" /><div className="settings-profile"><span className="settings-avatar">AM</span><div><button className="action-button" type="button">Change photo</button><p className="settings-hint">JPG or PNG, max 2 MB</p></div></div><div className="settings-form">{[['Full name', 'Admin MDRRMO'], ['Role', 'Municipal administrator'], ['Email address', 'admin.mdrrmo@cpg.gov.ph'], ['Contact number', '+63 912 345 6789'], ['Office', 'MDRRMO Office, Carlos P. Garcia'], ['Jurisdiction', 'CPG, Bohol — 23 barangays']].map(([label, value]) => <FormField key={label} label={label}><input defaultValue={value} disabled={label === 'Role' || label === 'Jurisdiction'} /></FormField>)}</div><button className="action-button-primary action-button-primary--mt5" type="button">Save changes</button></>,
    'Account & security': <SettingsRows title="Account & security" rows={[['Appearance', 'Dark mode', 'toggle'], ['Change password', 'Last changed 3 months ago', 'button'], ['Two-factor authentication', 'Add an extra layer of security', 'toggle'], ['Login alerts', 'Email on a new device sign-in', 'toggle'], ['Active sessions', '2 devices currently signed in', 'button']]} />,
    Notifications: <SettingsRows title="Notifications" rows={[['New SOS alerts', 'Real-time push when a resident sends SOS', 'toggle'], ['Weather / AWS updates', 'Automated weather station bulletins', 'toggle'], ['Evacuation capacity warnings', 'Notify at 80% center occupancy', 'toggle'], ['Email digest', 'Daily summary at 6:00 PM', 'toggle'], ['SMS escalation', 'Text message for critical priority only', 'toggle']]} />,
    'System config': <SettingsRows title="System configuration" rows={[['AWS API connection', 'Automated Weather Station integration', 'Connected'], ['Offline map sync', 'Push hazard updates to resident devices', 'toggle'], ['Resident app version', 'Current public application', 'v2.4.1'], ['Database backup', 'Last secure backup 4 hours ago', 'View'], ['Audit log', 'Review administrative actions', 'View']]} />,
    'Team & roles': <SettingsRows title="Team & roles" rows={[['Admin MDRRMO', 'Municipal administrator', 'Owner'], ['Ana Villanueva', 'Dispatch coordinator', 'Active'], ['Jose Ramos', 'Map and hazard officer', 'Active'], ['Mila Santos', 'Resident records officer', 'Active']]} />,
  }

  return <div className="settings-layout"><Panel className="settings-nav panel--pad-3"><nav className="stack-1">{settingsTabs.map(({ label, icon: Icon }) => <button className={`settings-tab${active === label ? ' is-active' : ''}`} key={label} onClick={() => setActive(label)} type="button"><Icon className="settings-tab__icon" />{label}</button>)}</nav></Panel><Panel className="panel--pad-5-7">{content[active]}</Panel></div>
}
