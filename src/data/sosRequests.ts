import { HeartPulse, Waves, type LucideIcon } from 'lucide-react'

export type SosCategory = 'Medical' | 'Flood assistance' | 'Evacuation'
export type SosPeriod = 'today' | 'last-week' | 'last-month'
export type SosStatus = 'Pending' | 'Coming' | 'Resolved'

export interface SosRequest {
  id: string
  name: string
  contact: string
  location: string
  coordinates: [number, number]
  type: string
  category: SosCategory
  priority: 'Critical' | 'High' | 'Medium'
  description: string
  period: SosPeriod
  received: string
  status: SosStatus
  color: string
  icon: LucideIcon
}

export const initialSosRequests: SosRequest[] = [
  { id: 'SOS-2024-0525', name: 'Maria Dela Cruz', contact: '0917-XXX-1208', location: 'Purok 2, Pitogo', coordinates: [10.118, 124.561], type: 'Medical emergency', category: 'Medical', priority: 'Critical', description: 'Elderly resident experiencing chest pain and shortness of breath. Medical transport is requested immediately.', period: 'today', received: 'Today at 9:14 AM', status: 'Pending', color: 'bg-rose-500/15 text-rose-300', icon: HeartPulse },
  { id: 'SOS-2024-0524', name: 'Rogelio Ramos', contact: '0917-XXX-1830', location: 'Purok 4, Lapinig', coordinates: [10.126, 124.545], type: 'Flood assistance', category: 'Flood assistance', priority: 'High', description: 'Floodwater is entering the family home. Four residents need evacuation assistance and supplies.', period: 'today', received: 'Today at 7:48 AM', status: 'Pending', color: 'bg-amber-400/15 text-amber-200', icon: Waves },
  { id: 'SOS-2024-0523', name: 'Jennifer Reyes', contact: '0917-XXX-1142', location: 'Purok 1, San Vicente', coordinates: [10.116, 124.572], type: 'Evacuation request', category: 'Evacuation', priority: 'High', description: 'Requester is with two children and needs transport to the nearest active evacuation center.', period: 'last-week', received: '4 days ago', status: 'Resolved', color: 'bg-indigo-500/15 text-indigo-200', icon: HeartPulse },
  { id: 'SOS-2024-0522', name: 'Alberto Villanueva', contact: '0917-XXX-1712', location: 'Purok 3, Baud', coordinates: [10.103, 124.58], type: 'Medical transport', category: 'Medical', priority: 'Medium', description: 'Resident requires non-critical medical transport after first aid was administered by local responders.', period: 'last-week', received: '6 days ago', status: 'Resolved', color: 'bg-rose-500/15 text-rose-300', icon: HeartPulse },
  { id: 'SOS-2024-0521', name: 'Lorna May Flores', contact: '0917-XXX-1684', location: 'Purok 5, Tugas', coordinates: [10.091, 124.545], type: 'Flood assistance', category: 'Flood assistance', priority: 'Medium', description: 'Flooding affected the household access route. Requester needs assistance moving to a safer area.', period: 'last-month', received: '18 days ago', status: 'Resolved', color: 'bg-amber-400/15 text-amber-200', icon: Waves },
  { id: 'SOS-2024-0520', name: 'Jericho M. Santos', contact: '0917-XXX-1326', location: 'Purok 1, Aguining', coordinates: [10.104, 124.532], type: 'Evacuation request', category: 'Evacuation', priority: 'High', description: 'Resident requested evacuation after severe winds damaged the home roof. One adult and two dependents were assisted.', period: 'last-month', received: '27 days ago', status: 'Resolved', color: 'bg-indigo-500/15 text-indigo-200', icon: HeartPulse },
]
