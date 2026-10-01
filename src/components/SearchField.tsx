import { Search } from 'lucide-react'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return <label className="relative block min-w-[220px] flex-1 sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.045] pl-9 pr-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/50" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>
}
