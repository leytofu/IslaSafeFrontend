import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptySosInbox, readSosInbox, receiveSosInbox, acknowledgeSosInbox } from '../src/utils/sosInbox.ts'

test('first login alarms for outstanding emergencies, not historical resolved records', () => {
  const inbox = receiveSosInbox(emptySosInbox(), [{ id: 'pending', status: 'Pending' }, { id: 'coming', status: 'Coming' }, { id: 'old', status: 'Resolved' }])
  assert.deepEqual(inbox.unreadIds, ['pending', 'coming'])
})
test('new submissions alarm once and repeated polls do not duplicate them', () => {
  const baseline = receiveSosInbox(emptySosInbox(), [])
  const records = [{ id: 'new', status: 'Pending' }]
  const first = receiveSosInbox(baseline, records)
  assert.deepEqual(receiveSosInbox(first, records).unreadIds, ['new'])
})
test('alarm survives a reload and status changes until the admin explicitly reviews SOS', () => {
  const inbox = receiveSosInbox(emptySosInbox(), [{ id: 'new', status: 'Pending' }])
  const restored = readSosInbox(JSON.stringify(inbox))
  assert.deepEqual(receiveSosInbox(restored, [{ id: 'new', status: 'Resolved' }]).unreadIds, ['new'])
  const reviewed = acknowledgeSosInbox(restored)
  assert.deepEqual(receiveSosInbox(readSosInbox(JSON.stringify(reviewed)), [{ id: 'new', status: 'Pending' }]).unreadIds, [])
})
test('a subsequent resident request rearms an acknowledged inbox', () => {
  const reviewed = acknowledgeSosInbox(receiveSosInbox(emptySosInbox(), [{ id: 'first', status: 'Pending' }]))
  assert.deepEqual(receiveSosInbox(reviewed, [{ id: 'first', status: 'Pending' }, { id: 'second', status: 'Pending' }]).unreadIds, ['second'])
})
test('corrupt or unavailable storage has a safe empty fallback', () => {
  for (const raw of [null, '{broken', '{}', '{"initialized":true,"seenIds":[],"unreadIds":[4]}']) assert.equal(readSosInbox(raw), null)
})

test('removed demo records no longer keep the alarm active', () => {
  const inbox = receiveSosInbox(emptySosInbox(), [{ id: 'demo', status: 'Pending' }, { id: 'resident', status: 'Pending' }])
  assert.deepEqual(receiveSosInbox(inbox, [{ id: 'resident', status: 'Pending' }]).unreadIds, ['resident'])
  assert.deepEqual(receiveSosInbox(inbox, []).unreadIds, [])
})
