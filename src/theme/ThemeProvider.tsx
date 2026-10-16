import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme, type ThemePreference } from './themeContext'

const storageKey = 'islasafe.theme'

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch { return 'system' }
}

function apply(preference: ThemePreference): Theme {
  const theme = preference === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preference
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setStoredPreference] = useState<ThemePreference>(readPreference)
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  const setPreference = useCallback((next: ThemePreference) => {
    try { localStorage.setItem(storageKey, next) } catch { /* Preserve the choice for this tab. */ }
    setTheme(apply(next))
    setStoredPreference(next)
  }, [])
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const systemChanged = () => { if (preference === 'system') setTheme(apply('system')) }
    const storageChanged = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return
      const next = readPreference()
      setStoredPreference(next)
      setTheme(apply(next))
    }
    media.addEventListener('change', systemChanged)
    window.addEventListener('storage', storageChanged)
    return () => { media.removeEventListener('change', systemChanged); window.removeEventListener('storage', storageChanged) }
  }, [preference])
  return <ThemeContext.Provider value={{ preference, theme, setPreference, toggle: () => setPreference(theme === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>
}

