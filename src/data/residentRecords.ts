export interface ResidentRecord {
  id: string
  name: string
  location: string
  phone: string
  household: string
  status: string
}

export const residentRecords: ResidentRecord[] = [
  { id: 'RES-00482', name: 'Maria Dela Cruz', location: 'Pitogo · Purok 2', phone: '0917-XXX-1208', household: 'HH-0482', status: 'Needs assistance' },
  { id: 'RES-00816', name: 'Rogelio Ramos', location: 'Lapinig · Purok 4', phone: '0917-XXX-1830', household: 'HH-0816', status: 'Evacuated' },
  { id: 'RES-00219', name: 'Jennifer Reyes', location: 'San Vicente · Purok 1', phone: '0917-XXX-1142', household: 'HH-0219', status: 'Safe' },
  { id: 'RES-00704', name: 'Pedro Abella', location: 'Baud · Purok 3', phone: '0917-XXX-1712', household: 'HH-0704', status: 'Stranded' },
  { id: 'RES-01027', name: 'Alma Santos', location: 'Aguining · Purok 5', phone: '0917-XXX-1901', household: 'HH-1027', status: 'Safe' },
]
