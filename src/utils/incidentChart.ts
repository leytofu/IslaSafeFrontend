const colors: Record<string, string> = {
  Typhoon: '#a78bfa', 'Storm surge': '#22d3ee', 'Intense rains': '#3b82f6',
  Landslide: '#f59e0b', 'Strong winds': '#34d399', Others: '#64748b',
}

export function incidentChart(rows: { type: string; count: number }[]) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  let cursor = 0
  const items = rows.map((row) => {
    const percent = total ? row.count / total * 100 : 0
    const from = cursor
    cursor += percent
    return { ...row, percent, color: colors[row.type] ?? colors.Others, from, to: cursor }
  })
  return {
    total, items,
    background: total ? `conic-gradient(${items.filter((item) => item.count > 0).map((item) => `${item.color} ${item.from}% ${item.to}%`).join(', ')})` : 'var(--glass-10)',
  }
}
