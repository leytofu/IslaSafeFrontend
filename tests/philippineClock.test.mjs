import { test } from 'node:test'
import assert from 'node:assert/strict'
import { philippineClock } from '../src/utils/philippineClock.ts'

test('clock uses Philippine time even when the device timezone differs', () => {
  const clock = philippineClock(new Date('2026-10-15T12:34:56Z'))
  assert.match(clock.time, /08:34:56\s?PM/i)
  assert.match(clock.date, /Thu/)
  assert.match(clock.date, /Oct 15, 2026/)
})

test('the date advances at Philippine midnight, including year rollover', () => {
  const before = philippineClock(new Date('2026-12-31T15:59:59Z'))
  const after = philippineClock(new Date('2026-12-31T16:00:00Z'))
  assert.match(before.date, /Dec 31, 2026/)
  assert.match(after.date, /Jan 1, 2027/)
  assert.match(after.time, /12:00:00\s?AM/i)
})
