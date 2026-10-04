import { Search } from 'lucide-react'
import './SearchField.css'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return <label className="search-field"><Search className="search-field__icon" /><input className="search-field__input" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>
}
