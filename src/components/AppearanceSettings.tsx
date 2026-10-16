import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { SectionHeading } from './Primitives'
import { useTheme } from '../theme/themeContext'

const options = [
  { value: 'light', label: 'Light', detail: 'A bright, clear workspace.', icon: Sun },
  { value: 'dark', label: 'Dark', detail: 'A softer view in low light.', icon: Moon },
  { value: 'system', label: 'System', detail: 'Match your device settings.', icon: Monitor },
] as const

export function AppearanceSettings() {
  const { preference, setPreference } = useTheme()
  return <div className="appearance-settings">
    <SectionHeading title="Appearance" detail="Choose how IslaSafe looks on this device. Your preference is saved automatically." />
    <fieldset className="theme-choices"><legend className="visually-hidden">Color theme</legend>{options.map(({ value, label, detail, icon: Icon }) => <label className={`theme-choice${preference === value ? ' is-selected' : ''}`} key={value}>
      <input className="visually-hidden" type="radio" name="color-theme" value={value} checked={preference === value} onChange={() => setPreference(value)} />
      <span className={`theme-preview theme-preview--${value}`} aria-hidden="true"><span className="theme-preview__sidebar" /><span className="theme-preview__content"><span /><span /><span /></span></span>
      <span className="theme-choice__label"><Icon aria-hidden="true" />{label}{preference === value && <Check className="theme-choice__check" aria-hidden="true" />}</span><span className="theme-choice__detail">{detail}</span>
    </label>)}</fieldset>
  </div>
}
