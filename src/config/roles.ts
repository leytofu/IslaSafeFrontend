import type { PageName } from '../components/Sidebar'

export type Role = 'admin' | 'campmanager' | 'residents'

export const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  campmanager: 'Camp Manager',
  residents: 'Resident',
}

/**
 * Which sidebar pages each role may open. The backend enforces the same
 * boundaries on the API (see EnsureRole middleware).
 */
export const allowedPages: Record<Role, PageName[]> = {
  admin: [
    'Dashboard',
    'SOS Management',
    'Hazard Map',
    'Evacuation Centers',
    'Incident Monitoring',
    'MDRRMO Link / AWS',
    'Advisories',
    'Residents',
    'Reports & Analytics',
    'Settings',
  ],
  campmanager: [
    'Dashboard',
    'SOS Management',
    'Hazard Map',
    'Evacuation Centers',
    'Incident Monitoring',
    'MDRRMO Link / AWS',
    'Advisories',
    'Reports & Analytics',
  ],
  residents: ['Hazard Map', 'Evacuation Centers', 'MDRRMO Link / AWS', 'Advisories'],
}

export function isRole(value: string): value is Role {
  return value === 'admin' || value === 'campmanager' || value === 'residents'
}

export function canManageSos(role: Role): boolean {
  return role === 'admin' || role === 'campmanager'
}

export function pagesForRole(role: string): PageName[] {
  return allowedPages[isRole(role) ? role : 'residents']
}
