import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const source = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8')
function boot(saved, dark, blocked = false) {
  const root = { dataset: {}, style: {} }
  runInNewContext(source, {
    document: { documentElement: root },
    matchMedia: () => ({ matches: dark }),
    localStorage: { getItem: () => { if (blocked) throw new Error('Storage blocked'); return saved } },
  })
  return root
}

test('saved theme is applied before rendering regardless of system appearance', () => {
  for (const saved of ['light', 'dark']) for (const dark of [true, false]) {
    const root = boot(saved, dark)
    assert.equal(root.dataset.theme, saved)
    assert.equal(root.style.colorScheme, saved)
  }
})

test('new users, invalid preferences and System mode follow the device', () => {
  for (const saved of [null, 'system', 'invalid']) for (const dark of [true, false]) {
    const root = boot(saved, dark)
    assert.equal(root.dataset.theme, dark ? 'dark' : 'light')
    assert.equal(root.style.colorScheme, root.dataset.theme)
  }
})

test('blocked storage still initializes native controls and page theme safely', () => {
  for (const dark of [true, false]) {
    const root = boot(null, dark, true)
    assert.equal(root.dataset.theme, dark ? 'dark' : 'light')
    assert.equal(root.style.colorScheme, root.dataset.theme)
  }
})
