import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
// Existing fixture boots real Laravel routes over an isolated in-memory database.
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
  await page.context().addCookies([{ name: 'XSRF-TOKEN', value: 'fixture-csrf', url: origin }])
  let failStats = false
  await page.route('**/api/**', async (route) => {
    const incoming = route.request(); const url = new URL(incoming.url())
    if (failStats && url.pathname.endsWith('/incidents/statistics')) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Statistics temporarily unavailable.' }) })
    }
    const response = await request(url.pathname + url.search, incoming.method(), incoming.postDataJSON() ?? undefined)
    await route.fulfill({ status: response.status, contentType: 'application/json', body: response.body })
  })
  await page.goto(origin)
  const stats = page.getByRole('region', { name: 'Incident statistics' })
  await stats.getByText('No incidents logged for this period.').waitFor()
  assert.equal(await stats.locator('.incident-breakdown__chart-center strong').innerText(), '0')
  await stats.getByRole('button', { name: 'View incidents' }).click()
  await page.getByRole('button', { name: 'Log incident', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Incident type', { exact: true }).selectOption('Typhoon')
  await dialog.getByLabel('Location', { exact: true }).fill('Pitogo test incident')
  await dialog.getByLabel('Severity', { exact: true }).selectOption('Critical')
  await dialog.getByLabel('Affected people or facilities (optional)').fill('12 households')
  await dialog.getByRole('button', { name: 'Save incident', exact: true }).click()
  await dialog.waitFor({ state: 'hidden' })
  await page.getByRole('cell', { name: 'Pitogo test incident', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click()
  await stats.getByRole('img', { name: /^1 logged incidents/ }).waitFor()
  assert.match(await page.getByRole('button', { name: /Active Incidents/ }).innerText(), /\b1\b/)
  await stats.getByRole('button', { name: 'View incidents' }).click()
  await page.getByRole('button', { name: /View or edit incident INC-/ }).click()
  await dialog.getByLabel('Status', { exact: true }).selectOption('Resolved')
  await dialog.getByRole('button', { name: 'Save incident', exact: true }).click()
  await dialog.waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click()
  await stats.getByText('0 active · 1 resolved or closed', { exact: true }).waitFor()
  const old = await request('/api/admin/incidents', 'POST', {
    type: 'Landslide', location: 'Previous-year test incident', severity: 'High', status: 'Monitoring',
    reported_at: new Date(Date.UTC(new Date().getUTCFullYear() - 1, 0, 15)).toISOString(),
  })
  assert.equal(old.status, 201)
  await stats.getByRole('combobox', { name: 'Incident statistics period' }).selectOption('all')
  await stats.getByRole('img', { name: /^2 logged incidents/ }).waitFor()
  assert.equal(await stats.getByText('1 (50.0%)', { exact: true }).count(), 2)
  await stats.getByRole('combobox', { name: 'Incident statistics period' }).selectOption('week')
  await stats.getByRole('img', { name: /^1 logged incidents/ }).waitFor()
  failStats = true
  await stats.getByRole('combobox', { name: 'Incident statistics period' }).selectOption('month')
  await stats.getByRole('alert').waitFor()
  failStats = false
  await stats.getByRole('button', { name: 'Retry', exact: true }).click()
  await stats.getByRole('img', { name: /^1 logged incidents/ }).waitFor()
  await mkdir('../.verification/incidents', { recursive: true })
  await stats.screenshot({ path: '../.verification/incidents/statistics-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await stats.screenshot({ path: '../.verification/incidents/statistics-mobile.png' })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.deepEqual(errors, [])
  console.log('PASS: real Laravel incident creation/editing, live chart/counts, period filtering, historical records, failure/retry, and responsive layout.')
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0]
  if (page) console.error(await page.locator('body').ariaSnapshot())
  throw error
} finally {
  await browser.close()
  fixture.stdin.end()
}
