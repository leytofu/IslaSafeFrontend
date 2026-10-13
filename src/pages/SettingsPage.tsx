import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { BellRing, Check, Camera, Loader2, Settings2, ShieldAlert, Users } from 'lucide-react'
import { Panel, SectionHeading, StatusPill } from '../components/Primitives'
import { isRole, roleLabels } from '../config/roles'
import type { AuthUser } from '../hooks/useAuth'
import './SettingsPage.css'

const settingsTabs = [
  { label: 'Profile', icon: Users }, { label: 'Account & security', icon: ShieldAlert }, { label: 'Notifications', icon: BellRing },
  { label: 'System config', icon: Settings2 }, { label: 'Team & roles', icon: Users },
]

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png']

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span className="field__label">{label}</span><span className="field-control">{children}</span></label>
}

function SettingsRows({ rows, title }: { rows: Array<[string, string, string]>; title: string }) {
  return <><SectionHeading title={title} /><div>{rows.map(([label, detail, action]) => <div className="settings-row" key={label}><div><p className="settings-row__label">{label}</p><p className="settings-row__detail">{detail}</p></div>{action === 'toggle' ? <button aria-label={`Toggle ${label}`} className="settings-toggle" type="button" /> : ['Connected', 'Active', 'Owner'].includes(action) ? <StatusPill tone="success">{action}</StatusPill> : <button className="action-button" type="button">{action}</button>}</div>)}</div></>
}

interface ProfileFormProps {
  user: AuthUser
  onSave: (input: { name: string; email: string; contact_number: string; office: string; jurisdiction: string; avatar?: File }) => Promise<string | null>
}

function initialsOf(name: string): string {
  return name.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U'
}

function ProfileForm({ user, onSave }: ProfileFormProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [contactNumber, setContactNumber] = useState(user.contact_number ?? '')
  const [office, setOffice] = useState(user.office ?? '')
  const [jurisdiction] = useState(user.jurisdiction ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const roleLabel = isRole(user.role) ? roleLabels[user.role] : user.role
  const initials = initialsOf(user.name)
  const displayedAvatar = avatarPreview ?? user.avatar_url

  const handlePhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Please choose a JPG or PNG image.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('Image must be 2 MB or smaller.')
      return
    }

    setAvatarError(null)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setSaved(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)
    setSaved(false)

    const failure = await onSave({
      name: name.trim(),
      email: email.trim(),
      contact_number: contactNumber.trim(),
      office: office.trim(),
      jurisdiction,
      ...(avatarFile ? { avatar: avatarFile } : {}),
    })

    setSaving(false)

    if (failure) {
      setError(failure)
      return
    }

    // Drop the local-only preview; the session now holds the server URL.
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setAvatarPreview(null)
    setSaved(true)
  }

  return (
    <>
      <SectionHeading detail="This information appears across the operations workspace." title="Profile information" />

      <div className="settings-profile">
        <span className="settings-avatar">
          {/* Initials as permanent fallback under the photo. */}
          {initials}
          {displayedAvatar && (
            <img
              alt="Profile photo"
              onError={(event) => { event.currentTarget.style.display = 'none' }}
              src={displayedAvatar}
            />
          )}
        </span>
        <div>
          <input ref={fileInputRef} accept="image/jpeg,image/png" className="settings-file-input" onChange={handlePhotoSelected} type="file" />
          <button className="action-button" onClick={() => fileInputRef.current?.click()} type="button"><Camera /> Change photo</button>
          <p className="settings-hint">JPG or PNG, max 2 MB</p>
          {avatarError && <p className="settings-feedback settings-feedback--error" role="alert">{avatarError}</p>}
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <FormField label="Full name"><input autoComplete="name" onChange={(event) => { setName(event.target.value); setSaved(false) }} required type="text" value={name} /></FormField>
        <FormField label="Email address"><input autoComplete="email" onChange={(event) => { setEmail(event.target.value); setSaved(false) }} required type="email" value={email} /></FormField>
        <FormField label="Contact number"><input autoComplete="tel" onChange={(event) => { setContactNumber(event.target.value); setSaved(false) }} placeholder="+63 9XX XXX XXXX" type="tel" value={contactNumber} /></FormField>
        <FormField label="Office"><input onChange={(event) => { setOffice(event.target.value); setSaved(false) }} placeholder="MDRRMO Office" type="text" value={office} /></FormField>
        <FormField label="Role"><input disabled value={roleLabel} /></FormField>
        <FormField label="Jurisdiction"><input disabled value={jurisdiction || 'CPG, Bohol — 23 barangays'} /></FormField>

        {error && <p className="settings-feedback settings-feedback--error" role="alert">{error}</p>}
        {saved && <p className="settings-feedback settings-feedback--success" role="status"><Check /> Profile updated.</p>}

        <button className="action-button-primary action-button-primary--mt5" disabled={saving} type="submit">
          {saving ? <><Loader2 className="is-spinning" /> Saving…</> : 'Save changes'}
        </button>
      </form>
    </>
  )
}

interface SettingsPageProps {
  user: AuthUser | null
  onSaveProfile: (input: { name: string; email: string; contact_number: string; office: string; jurisdiction: string; avatar?: File }) => Promise<string | null>
}

export function SettingsPage({ user, onSaveProfile }: SettingsPageProps) {
  const [active, setActive] = useState('Profile')

  const content: Record<string, ReactNode> = {
    Profile: user ? <ProfileForm key={user.id} onSave={onSaveProfile} user={user} /> : null,
    'Account & security': <SettingsRows title="Account & security" rows={[['Appearance', 'Dark mode', 'toggle'], ['Change password', 'Last changed 3 months ago', 'button'], ['Two-factor authentication', 'Add an extra layer of security', 'toggle'], ['Login alerts', 'Email on a new device sign-in', 'toggle'], ['Active sessions', '2 devices currently signed in', 'button']]} />,
    Notifications: <SettingsRows title="Notifications" rows={[['New SOS alerts', 'Real-time push when a resident sends SOS', 'toggle'], ['Weather / AWS updates', 'Automated weather station bulletins', 'toggle'], ['Evacuation capacity warnings', 'Notify at 80% center occupancy', 'toggle'], ['Email digest', 'Daily summary at 6:00 PM', 'toggle'], ['SMS escalation', 'Text message for critical priority only', 'toggle']]} />,
    'System config': <SettingsRows title="System configuration" rows={[['AWS API connection', 'Automated Weather Station integration', 'Connected'], ['Offline map sync', 'Push hazard updates to resident devices', 'toggle'], ['Resident app version', 'Current public application', 'v2.4.1'], ['Database backup', 'Last secure backup 4 hours ago', 'View'], ['Audit log', 'Review administrative actions', 'View']]} />,
    'Team & roles': <SettingsRows title="Team & roles" rows={[['Admin MDRRMO', 'Municipal administrator', 'Owner'], ['Ana Villanueva', 'Dispatch coordinator', 'Active'], ['Jose Ramos', 'Map and hazard officer', 'Active'], ['Mila Santos', 'Resident records officer', 'Active']]} />,
  }

  return <div className="settings-layout"><Panel className="settings-nav panel--pad-3"><nav className="stack-1">{settingsTabs.map(({ label, icon: Icon }) => <button className={`settings-tab${active === label ? ' is-active' : ''}`} key={label} onClick={() => setActive(label)} type="button"><Icon className="settings-tab__icon" />{label}</button>)}</nav></Panel><Panel className="panel--pad-5-7">{content[active]}</Panel></div>
}
