import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './CompactSelect.css'

type Option = { value: string; label: string; disabled?: boolean }
type SelectProps = { label: string; value: string; options: Option[]; onChange: (value: string) => void; disabled?: boolean; searchable?: boolean }
export function CompactSelect(props: SelectProps) {
  return props.searchable ? <SearchableSelect {...props} /> : <StaticCompactSelect {...props} />
}

function SearchableSelect({ label, value, options, onChange, disabled = false }: SelectProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)
  const matches = (text: string) => options.filter((option) => !text.trim() || (option.value && option.label.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase())))
  const visible = matches(query ?? '')
  function close() { setOpen(false); setQuery(null); setActive(-1) }
  function expand() { setQuery(''); setOpen(true); setActive(options.findIndex((option) => option.value === value && !option.disabled)) }
  function choose(option: Option) { if (disabled || option.disabled) return; onChange(option.value); close() }
  useEffect(() => { if (open) list.current?.scrollIntoView({ block: 'nearest' }) }, [open])
  useEffect(() => { if (open && active >= 0) list.current?.children[active]?.scrollIntoView({ block: 'nearest' }) }, [open, active])
  return <div className="field compact-select"
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close() }}
    onKeyDownCapture={(event) => { if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() } }}>
    <span className="field__label" id={id + '-label'}>{label}</span>
    <div className="compact-select__search-control">
      <input ref={input} role="combobox" aria-labelledby={id + '-label'} aria-autocomplete="list" aria-expanded={open} aria-controls={open ? id : undefined}
        aria-activedescendant={open && active >= 0 && visible[active] ? id + '-option-' + active : undefined}
        autoComplete="off" disabled={disabled} placeholder={selected?.value ? 'Type to search...' : selected?.label ?? 'Type to search...'}
        value={query ?? (selected?.value ? selected.label : '')} onFocus={expand}
        onChange={(event) => { const text = event.target.value; setQuery(text); setOpen(true); setActive(matches(text).findIndex((option) => !option.disabled)) }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open) { expand(); return }
            const direction = event.key === 'ArrowDown' ? 1 : -1
            for (let index = active < 0 ? (direction === 1 ? 0 : visible.length - 1) : active + direction; index >= 0 && index < visible.length; index += direction) {
              if (!visible[index].disabled) { setActive(index); break }
            }
          } else if (event.key === 'Enter' && open) {
            event.preventDefault()
            if (visible[active]) choose(visible[active])
          } else if (event.key === 'Tab') close()
        }} />
      <button type="button" aria-label={'Show ' + label.replace(/\s*\*$/, '') + ' options'} aria-expanded={open} disabled={disabled} onMouseDown={(event) => event.preventDefault()}
        onClick={() => { if (open) close(); else { input.current?.focus({ preventScroll: true }); expand() } }}><ChevronDown aria-hidden="true" size={16} /></button>
    </div>
    {open && <div ref={list} id={id} role="listbox" aria-labelledby={id + '-label'} className="compact-select__suggestions">
      {visible.map((option, index) => <div id={id + '-option-' + index} role="option" key={option.value} aria-selected={value === option.value} aria-disabled={option.disabled || undefined}
        className={'compact-select__suggestion' + (active === index ? ' is-active' : '')}
        onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)} onMouseMove={() => { if (!option.disabled) setActive(index) }}>{option.label}</div>)}
      {visible.length === 0 && <p className="compact-select__empty" role="status">No matches found. Try another name.</p>}
    </div>}
  </div>
}

function StaticCompactSelect({ label, value, options, onChange, disabled = false }: SelectProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLSelectElement>(null)
  const keyboard = useRef(false)
  const selected = options.find((option) => option.value === value)
  function close() { setOpen(false); trigger.current?.focus({ preventScroll: true }) }
  function expand(fromKeyboard = false) {
    if (disabled) return
    keyboard.current = fromKeyboard
    setOpen(true)
    requestAnimationFrame(() => {
      list.current?.scrollIntoView({ block: 'nearest' })
      list.current?.focus({ preventScroll: true })
    })
  }
  return <div className="field compact-select"
    onKeyDownCapture={(event) => { if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() } }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <span className="field__label" id={id + '-label'}>{label}</span>
    <button ref={trigger} className="compact-select__trigger" type="button" aria-labelledby={id + '-label'} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined} disabled={disabled}
      onClick={() => { if (open) setOpen(false); else expand() }} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); expand(true) } }}>
      <span>{selected?.label ?? 'Select an option'}</span><ChevronDown aria-hidden="true" size={16} />
    </button>
    {open && <select ref={list} id={id} className="compact-select__list" size={5} aria-labelledby={id + '-label'} disabled={disabled} value={value}
      onPointerDown={() => { keyboard.current = false }}
      onChange={(event) => { onChange(event.target.value); if (!keyboard.current) close() }}
      onKeyDown={(event) => { keyboard.current = true; if (event.key === 'Escape' || event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); close() } }}>
      {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>}
  </div>
}
