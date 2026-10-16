import { useEffect, useRef, useState } from 'react'
import { Building2, Search, Siren, TriangleAlert, UserRound, X } from 'lucide-react'
import { apiFetch } from '../utils/api'
import type { HeaderResult } from '../types/header'

const icons = { sos: Siren, incident: TriangleAlert, center: Building2, resident: UserRound }
const labels = { sos: 'SOS request', incident: 'Incident', center: 'Evacuation center', resident: 'Resident' }

export function HeaderSearch({ sessionKey, onSelect }: { sessionKey: string; onSelect: (result: HeaderResult) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<{ scope: string; items: HeaderResult[]; error: string }>({ scope: '', items: [], error: '' })
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const term = query.trim()
  const scope = `${sessionKey}:${term}:${revision}`
  const current = result.scope === scope
  const items = current ? result.items : []
  const searching = term.length >= 2 && !current
  useEffect(() => {
    if (term.length < 2) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      apiFetch<{ data: HeaderResult[] }>(`/admin/search?q=${encodeURIComponent(term)}`, { sessionKey })
        .then(({ data }) => { if (!cancelled) setResult({ scope, items: data, error: '' }) })
        .catch((error: unknown) => { if (!cancelled) setResult({ scope, items: [], error: error instanceof Error ? error.message : 'Search is unavailable.' }) })
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [term, sessionKey, scope])
  useEffect(() => {
    if (open) document.getElementById(`header-result-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open, result.scope])
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const shortcut = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus(); setOpen(true) }
    }
    document.addEventListener('pointerdown', outside); window.addEventListener('keydown', shortcut)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', shortcut) }
  }, [])
  const choose = (item: HeaderResult) => { setOpen(false); setQuery(''); onSelect(item) }
  return <div className="topbar__search header-search" ref={root} onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }}>
    <Search className="topbar__search-icon" aria-hidden="true" />
    <input ref={input} className="topbar__search-input" aria-label="Search records" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="header-search-results" aria-activedescendant={open && items[active] ? `header-result-${active}` : undefined} autoComplete="off" maxLength={120} placeholder="Search names, SOS ID, barangay…" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0) }} onKeyDown={(event) => {
      if (event.key === 'Escape') { setOpen(false); event.stopPropagation() }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive((value) => items.length ? (value + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length : 0) }
      if (event.key === 'Enter' && open && items[active]) { event.preventDefault(); choose(items[active]) }
    }} />
    {query && <button className="header-search__clear" aria-label="Clear search" onClick={() => { setQuery(''); input.current?.focus() }} type="button"><X /></button>}
    {open && <div className="header-popover header-search__popover">
      <div className="header-popover__heading"><strong>Search records</strong><span>Ctrl K</span></div>
      <p className="header-popover__hint" role="status">{term.length < 2 ? 'Type at least 2 characters to search saved records.' : searching ? 'Searching…' : current && result.error ? 'Unable to complete search.' : items.length ? `${items.length} results · up to 5 per category` : 'No matching records found.'}</p>
      {current && result.error && term.length >= 2 && <div className="header-popover__error" role="alert">{result.error}<button className="action-button" onClick={() => setRevision((value) => value + 1)} type="button">Retry</button></div>}
      <ul id="header-search-results" role="listbox" aria-label="Search results" className="header-result-list">{items.map((item, index) => {
        const Icon = icons[item.kind]
        return <li key={`${item.kind}:${item.id}`} role="option" id={`header-result-${index}`} aria-selected={active === index} className={`header-result${active === index ? ' is-active' : ''}`}>
          <button type="button" onClick={() => choose(item)} onPointerEnter={() => setActive(index)}><Icon className="header-result__icon" aria-hidden="true" /><span className="header-result__content"><span className="header-result__title">{item.title}</span><span className="header-result__detail">{item.subtitle}</span><span className="header-result__kind">{labels[item.kind]}{item.status ? ` · ${item.status}` : ''}</span></span></button>
        </li>
      })}</ul>
    </div>}
  </div>
}
