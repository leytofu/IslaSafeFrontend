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
const session = await next()
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--enable-unsafe-swiftshader'] })
try {
  const sos = await request('/api/sos-requests', 'POST', { name: 'Header SOS Resident', contact: '09170000000', location: 'Header Pitogo pier', latitude: 10.11, longitude: 124.55, type: 'Medical emergency', category: 'Medical', priority: 'Critical', description: 'Isolated header browser test' })
  assert.equal(sos.status, 201)
  const report = { type: 'Typhoon', location: 'Header incident location', severity: 'High', status: 'Monitoring', reported_at: new Date().toISOString() }
  assert.equal((await request('/api/admin/incidents', 'POST', report)).status, 201)
  assert.equal((await request('/api/auth/register', 'POST', { name: 'Header Resident Account', email: 'header@example.test', password: 'FixturePassword123!', password_confirmation: 'FixturePassword123!' })).status, 201)
  const center = await request('/api/admin/evacuation/centers', 'POST', { name: 'Header evacuation center', place_id: session.place_id, capacity: 100, status: 'Operational', latitude: 10.11, longitude: 124.55 })
  assert.equal(center.status, 201, center.body)
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
  await page.context().addCookies([{ name: 'XSRF-TOKEN', value: 'fixture-csrf', url: origin }])
  let failSearch = false; let failRead = false
  await page.route('**/api/**', async (route) => {
    const incoming = route.request(); const url = new URL(incoming.url())
    if ((failSearch && url.pathname.endsWith('/admin/search')) || (failRead && url.pathname.endsWith('/notifications/read'))) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture service temporarily unavailable.' }) })
    }
    const response = await request(url.pathname + url.search, incoming.method(), incoming.postDataJSON() ?? undefined)
    await route.fulfill({ status: response.status, contentType: 'application/json', body: response.body })
  })
  await page.goto(origin)
  const search = page.getByRole('combobox', { name: 'Search records', exact: true })
  const results = page.getByRole('listbox', { name: 'Search results', exact: true })
  await search.fill('Header')
  await results.getByRole('option').filter({ hasText: 'Header SOS Resident' }).waitFor()
  assert.equal(await results.getByRole('option').count(), 4)
  await search.press('Enter')
  await page.getByRole('dialog', { name: 'SOS request details', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Close SOS request details', exact: true }).click()
  await page.getByRole('button', { name: 'View notifications, 2 unread', exact: true }).waitFor()
  const firstTime = await page.locator('.topbar__clock-time').innerText()
  await page.waitForFunction((old) => document.querySelector('.topbar__clock-time').textContent !== old, firstTime, { timeout: 4000 })
  const dateTime = await page.locator('.topbar__clock').getAttribute('datetime')
  const date = new Date(dateTime).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  assert((await page.locator('.topbar__clock').innerText()).includes(date))
  await search.fill('Header Resident')
  await results.getByRole('option').filter({ hasText: 'Header Resident Account' }).getByRole('button').click()
  const resident = page.getByRole('dialog', { name: 'Header Resident Account', exact: true })
  await resident.getByText('header@example.test', { exact: true }).waitFor()
  await resident.getByRole('button', { name: 'Close', exact: true }).click()
  await search.fill('Header evacuation')
  await results.getByRole('option').filter({ hasText: 'Header evacuation center' }).getByRole('button').click()
  await page.getByRole('dialog', { name: 'Header evacuation center', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Close center details', exact: true }).click()
  await search.fill('does-not-exist')
  await page.getByText('No matching records found.', { exact: true }).waitFor()
  await search.press('Escape')
  await page.keyboard.press('Control+k')
  assert.equal(await search.getAttribute('aria-expanded'), 'true')
  failSearch = true
  await search.fill('search failure')
  await page.locator('.header-search__popover').getByRole('alert').waitFor()
  failSearch = false
  await page.locator('.header-search__popover').getByRole('button', { name: 'Retry', exact: true }).click()
  await page.getByText('No matching records found.', { exact: true }).waitFor()
  await search.press('Escape')
  await page.getByRole('button', { name: 'View notifications, 2 unread', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Notifications', exact: true })
  failRead = true
  await panel.getByRole('button', { name: 'Mark all as read', exact: true }).click()
  await panel.getByRole('alert').waitFor()
  await page.getByRole('button', { name: 'View notifications, 2 unread', exact: true }).waitFor()
  failRead = false
  await panel.getByRole('button', { name: 'Mark all as read', exact: true }).click()
  await panel.getByText('0 unread', { exact: true }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: 'View notifications', exact: true }).click()
  await panel.getByText('0 unread', { exact: true }).waitFor()
  assert.equal((await request('/api/admin/notifications')).status, 200)
  const fresh = await request('/api/admin/incidents', 'POST', { ...report, location: 'New header notification', status: 'Active' })
  assert.equal(fresh.status, 201)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByRole('button', { name: 'View notifications, 1 unread', exact: true }).waitFor()
  await panel.getByRole('button').filter({ hasText: 'New header notification' }).click()
  const incident = page.getByRole('dialog', { name: /Edit incident INC-/ })
  await incident.getByLabel('Location', { exact: true }).waitFor()
  assert.equal(await incident.getByLabel('Location', { exact: true }).inputValue(), 'New header notification')
  await incident.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'View notifications', exact: true }).waitFor()
  await page.getByRole('button', { name: /View notifications/ }).click()
  await mkdir('../.verification/header', { recursive: true })
  await page.screenshot({ path: '../.verification/header/notifications-desktop.png', fullPage: true })
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await search.fill('Header')
  await results.getByRole('option').first().waitFor()
  const bounds = await page.locator('.header-search__popover').boundingBox()
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 390)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.screenshot({ path: '../.verification/header/search-mobile.png', fullPage: true })
  await search.press('Escape')
  await page.getByRole('button', { name: /View notifications/ }).click()
  const mobilePanel = await panel.boundingBox()
  assert(mobilePanel.x >= 0 && mobilePanel.x + mobilePanel.width <= 390)
  assert.deepEqual(errors, [])
  console.log('PASS: real backend search across four record types, keyboard opening, live PH clock, persistent notification reads, new activity, failures/retry, record navigation and mobile layout.')
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0]
  if (page) console.error(await page.locator('body').ariaSnapshot())
  throw error
} finally {
  await browser.close()
  fixture.stdin.end()
}
