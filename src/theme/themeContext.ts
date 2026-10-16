import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'
interface ThemeState { theme: Theme; preference: ThemePreference; setPreference: (preference: ThemePreference) => void; toggle: () => void }
export const ThemeContext = createContext<ThemeState | null>(null)

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('Theme controls must be used within ThemeProvider.')
  return value
}
