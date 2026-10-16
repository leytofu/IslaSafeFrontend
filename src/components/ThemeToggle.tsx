import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/themeContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
  return <button aria-label={label} title={label} className="topbar__icon-button theme-toggle" onClick={toggle} type="button">{theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</button>
}
