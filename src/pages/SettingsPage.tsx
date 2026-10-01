import { useState, type ReactNode } from 'react'
import { BellRing, Settings2, ShieldAlert, Users } from 'lucide-react'
import { Panel, SectionHeading, StatusPill } from '../components/Primitives'

const settingsTabs = [
  { label: 'Profile', icon: Users }, { label: 'Account & security', icon: ShieldAlert }, { label: 'Notifications', icon: BellRing },
  { label: 'System config', icon: Settings2 }, { label: 'Team & roles', icon: Users },
]

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</span><span className="field-control">{children}</span></label>
}

function SettingsRows({ rows, title }: { rows: Array<[string, string, string]>; title: string }) {
  return <><SectionHeading title={title} /><div>{rows.map(([label, detail, action]) => <div className="flex items-center justify-between gap-4 border-b border-white/8 py-4 last:border-0" key={label}><div><p className="text-xs font-semibold text-slate-200">{label}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div>{action === 'toggle' ? <button aria-label={`Toggle ${label}`} className="relative h-6 w-11 rounded-full bg-indigo-500/80 shadow-inner transition after:absolute after:left-6 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow" type="button" /> : ['Connected', 'Active', 'Owner'].includes(action) ? <StatusPill tone="success">{action}</StatusPill> : <button className="action-button" type="button">{action}</button>}</div>)}</div></>
}

export function SettingsPage() {
  const [active, setActive] = useState('Profile')
  const content: Record<string, ReactNode> = {
    Profile: <><SectionHeading title="Profile information" /><div className="mb-6 flex items-center gap-4"><span className="grid size-16 place-items-center rounded-full border-2 border-white/20 bg-gradient-to-br from-violet-400 to-blue-500 text-lg font-bold text-white">AM</span><div><button className="action-button" type="button">Change photo</button><p className="mt-1.5 text-[10px] text-slate-500">JPG or PNG, max 2 MB</p></div></div><div className="grid gap-4 sm:grid-cols-2">{[['Full name', 'Admin MDRRMO'], ['Role', 'Municipal administrator'], ['Email address', 'admin.mdrrmo@cpg.gov.ph'], ['Contact number', '+63 912 345 6789'], ['Office', 'MDRRMO Office, Carlos P. Garcia'], ['Jurisdiction', 'CPG, Bohol — 23 barangays']].map(([label, value]) => <FormField key={label} label={label}><input defaultValue={value} disabled={label === 'Role' || label === 'Jurisdiction'} /></FormField>)}</div><button className="action-button-primary mt-5" type="button">Save changes</button></>,
    'Account & security': <SettingsRows title="Account & security" rows={[['Appearance', 'Dark mode', 'toggle'], ['Change password', 'Last changed 3 months ago', 'button'], ['Two-factor authentication', 'Add an extra layer of security', 'toggle'], ['Login alerts', 'Email on a new device sign-in', 'toggle'], ['Active sessions', '2 devices currently signed in', 'button']]} />,
    Notifications: <SettingsRows title="Notifications" rows={[['New SOS alerts', 'Real-time push when a resident sends SOS', 'toggle'], ['Weather / AWS updates', 'Automated weather station bulletins', 'toggle'], ['Evacuation capacity warnings', 'Notify at 80% center occupancy', 'toggle'], ['Email digest', 'Daily summary at 6:00 PM', 'toggle'], ['SMS escalation', 'Text message for critical priority only', 'toggle']]} />,
    'System config': <SettingsRows title="System configuration" rows={[['AWS API connection', 'Automated Weather Station integration', 'Connected'], ['Offline map sync', 'Push hazard updates to resident devices', 'toggle'], ['Resident app version', 'Current public application', 'v2.4.1'], ['Database backup', 'Last secure backup 4 hours ago', 'View'], ['Audit log', 'Review administrative actions', 'View']]} />,
    'Team & roles': <SettingsRows title="Team & roles" rows={[['Admin MDRRMO', 'Municipal administrator', 'Owner'], ['Ana Villanueva', 'Dispatch coordinator', 'Active'], ['Jose Ramos', 'Map and hazard officer', 'Active'], ['Mila Santos', 'Resident records officer', 'Active']]} />,
  }

  return <div className="mx-auto grid w-full max-w-[1600px] gap-5 lg:grid-cols-[220px_minmax(0,1fr)]"><Panel className="h-fit p-3"><nav className="space-y-1">{settingsTabs.map(({ label, icon: Icon }) => <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold transition ${active === label ? 'bg-indigo-500/15 text-indigo-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`} key={label} onClick={() => setActive(label)} type="button"><Icon className="size-4" />{label}</button>)}</nav></Panel><Panel className="p-5 sm:p-7">{content[active]}</Panel></div>
}
