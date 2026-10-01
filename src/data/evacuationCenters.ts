export type MapPosition = [number, number]

export interface EvacuationCenter {
  name: string
  barangay: string
  capacity: number
  current: number
  status: string
  contact: string
  position?: MapPosition
}

export const initialEvacuationCenters: EvacuationCenter[] = [
  { name: 'Pitogo Central School', barangay: 'Pitogo', capacity: 220, current: 148, status: 'Operational', contact: '0917-XXX-1001' },
  { name: 'Baud Barangay Hall', barangay: 'Baud', capacity: 100, current: 82, status: 'Near capacity', contact: '0917-XXX-1002' },
  { name: 'Lapinig Covered Court', barangay: 'Lapinig', capacity: 160, current: 74, status: 'Operational', contact: '0917-XXX-1003' },
  { name: 'San Vicente Elementary', barangay: 'San Vicente', capacity: 180, current: 126, status: 'Operational', contact: '0917-XXX-1004' },
  { name: 'Aguining Multi-purpose Hall', barangay: 'Aguining', capacity: 90, current: 19, status: 'Operational', contact: '0917-XXX-1005' },
  { name: 'Tugas Community Center', barangay: 'Tugas', capacity: 120, current: 98, status: 'Near capacity', contact: '0917-XXX-1006' },
]
