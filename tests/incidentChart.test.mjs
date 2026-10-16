import { test } from 'node:test'
import assert from 'node:assert/strict'
import { incidentChart } from '../src/utils/incidentChart.ts'

test('chart segments and percentages are calculated from actual counts', () => {
  const chart = incidentChart([{ type: 'Typhoon', count: 3 }, { type: 'Landslide', count: 1 }, { type: 'Others', count: 0 }])
  assert.equal(chart.total, 4)
  assert.deepEqual(chart.items.map((item) => item.percent), [75, 25, 0])
  assert.equal(chart.items[0].to, chart.items[1].from)
  assert.equal(chart.items[1].to, 100)
  assert.equal(chart.background.includes('NaN'), false)
  assert.equal(chart.background.includes('#64748b'), false, 'empty categories do not draw slices')
})

test('empty periods have a neutral ring and no invalid percentages', () => {
  for (const rows of [[], [{ type: 'Typhoon', count: 0 }]]) {
    const chart = incidentChart(rows)
    assert.equal(chart.total, 0)
    assert.equal(chart.background, 'var(--glass-10)')
    assert(chart.items.every((item) => item.percent === 0))
  }
})

test('updated counts replace old proportions and unknown categories have a color fallback', () => {
  const chart = incidentChart([{ type: 'Typhoon', count: 1 }, { type: 'Landslide', count: 1 }, { type: 'New category', count: 1 }])
  assert.equal(chart.total, 3)
  assert(Math.abs(chart.items.at(-1).to - 100) < 0.00001)
  assert.equal(chart.items.at(-1).color, '#64748b')
})
