export function statusTone(value: string) {
  if (/critical|pending|needs|stranded/i.test(value)) return 'danger' as const
  if (/high|warning|near|moderate|monitor/i.test(value)) return 'warning' as const
  if (/operational|safe|resolved|closed|stable|active|evacuated/i.test(value)) return 'success' as const
  return 'info' as const
}
