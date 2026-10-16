import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const fixture = spawn('php', ['../backend/scripts/center-management-fixture.php'], { stdio: ['pipe', 'pipe', 'inherit'] })
const lines = []; const waiters = []
createInterface({ input: fixture.stdout }).on('line', (line) => {
  if (waiters.length) waiters.shift()(JSON.parse(line)); else lines.push(JSON.parse(line))
})
const next = () => lines.length ? Promise.resolve(lines.shift()) : new Promise((resolve) => waiters.push(resolve))
let queue = Promise.resolve()
function request(path, method = 'GET', body) {
  const result = queue.then(async () => { fixture.stdin.write(JSON.stringify({ path, method, body }) + '\n'); return next() })
  queue = result.catch(() => {})
  return result
}
await next()
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
  await page.context().addCookies([{ name: 'XSRF-TOKEN', value: 'fixture-csrf', url: origin }])
  let failSave = false; let failLoad = false
  await page.route('**/api/**', async route => {
    const incoming = route.request(); const url = new URL(incoming.url())
    if (url.pathname.includes('/admin/advisories') && ((failSave && incoming.method() !== 'GET') || (failLoad && incoming.method() === 'GET'))) return route.fulfill({ status: 503, json: { message: 'Advisory service unavailable.' } })
    const response = await request(url.pathname + url.search, incoming.method(), incoming.postDataJSON() ?? undefined)
    await route.fulfill({ status: response.status, contentType: 'application/json', body: response.body })
  })
  await page.goto(origin)
  await page.getByText('No active advisories.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'View all Active advisories', exact: true }).click()
  const target = page.getByRole('combobox', { name: 'Target area', exact: true })
  assert.equal(await target.locator('option').count(), 24)
  assert.equal(await target.inputValue(), 'All barangays')
  await target.selectOption('Villa Milagrosa')
  await target.selectOption('All barangays')
  await page.getByLabel('Title', { exact: true }).fill('Coastal evacuation notice')
  await page.getByLabel('Message', { exact: true }).fill('Proceed to the designated evacuation center.\nBring essential supplies.')
  await page.getByLabel('Priority', { exact: true }).selectOption('Critical')
  await page.getByLabel('Target area', { exact: true }).selectOption('Lapinig')
  failSave = true
  await page.getByRole('button', { name: 'Publish advisory', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Advisory service unavailable.' }).waitFor()
  assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), 'Coastal evacuation notice')
  failSave = false
  await page.getByRole('button', { name: 'Publish advisory', exact: true }).click()
  await page.getByText('Advisory published.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Edit Coastal evacuation notice', exact: true }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: 'Coastal evacuation notice', exact: false }).click()
  const dialog = page.getByRole('dialog', { name: 'Coastal evacuation notice', exact: true })
  await dialog.getByText('Lapinig', { exact: false }).waitFor()
  await dialog.getByText('Bring essential supplies.', { exact: false }).waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await dialog.count(), 0)
  for (const mode of ['light', 'dark']) {
    const current = await page.locator('html').getAttribute('data-theme')
    if (current !== mode) await page.getByRole('button', { name: `Switch to ${mode} theme`, exact: true }).click()
    await mkdir('../.verification/advisories', { recursive: true })
    await page.screenshot({ path: `../.verification/advisories/dashboard-${mode}.png`, fullPage: true })
  }
  await page.getByRole('button', { name: 'View all Active advisories', exact: true }).click()
  await page.getByRole('button', { name: 'Edit Coastal evacuation notice', exact: true }).click()
  await page.getByLabel('Message', { exact: true }).fill('Updated evacuation instructions.')
  await page.getByLabel('Status', { exact: true }).selectOption('Archived')
  await page.getByRole('button', { name: 'Save advisory', exact: true }).click()
  await page.getByText('Advisory updated.', { exact: true }).waitFor()
  await page.getByText('No advisories match these filters.', { exact: true }).waitFor()
  await page.getByLabel('Advisory status', { exact: true }).selectOption('Archived')
  await page.getByRole('button', { name: 'Edit Coastal evacuation notice', exact: true }).click()
  assert.equal(await page.getByLabel('Message', { exact: true }).inputValue(), 'Updated evacuation instructions.')
  await page.getByLabel('Status', { exact: true }).selectOption('Active')
  await page.getByRole('button', { name: 'Save advisory', exact: true }).click()
  await page.getByText('Advisory updated.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click()
  await page.locator('.advisory-card').waitFor()
  failLoad = true
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByRole('alert').filter({ hasText: 'Advisory service unavailable.' }).waitFor()
  failLoad = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Advisory service unavailable.' }).waitFor({ state: 'detached' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.advisory-card').click()
  await page.getByRole('dialog').waitFor()
  assert(await page.getByRole('dialog').evaluate(node => node.getBoundingClientRect().width < window.innerWidth))
  await page.screenshot({ path: '../.verification/advisories/mobile-detail.png', fullPage: true })
  assert.deepEqual(errors, [])
  console.log('PASS: persisted publishing, edit, archive, restore, details, error/retry, themes and mobile.')
} finally { await browser.close(); fixture.stdin.end(); fixture.kill() }
