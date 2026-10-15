import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Set PLAYWRIGHT_MODULE to a local playwright/index.mjs. No application data is changed.
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
  await mkdir('../.verification', { recursive: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  let creationRequests = 0
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript((value) => localStorage.setItem('islasafe.session', JSON.stringify(value)), session)
  await page.route('**/api/**', async (route) => {
    const incoming = route.request(); const url = new URL(incoming.url())
    if (incoming.method() === 'POST' && url.pathname === '/api/admin/evacuation/centers') creationRequests++
    const response = await request(url.pathname + url.search, incoming.method(), incoming.postDataJSON() ?? undefined)
    await route.fulfill({ status: response.status, contentType: 'application/json', body: response.body })
  })
  await page.goto(process.env.FRONTEND_URL || 'http://localhost:5173')
  await page.getByRole('button', { name: 'Evacuation Centers', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Operations setup', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Add Center', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Add evacuation center', exact: true })
  await dialog.waitFor()
  await dialog.getByLabel('Evacuation center name *', { exact: true }).fill('Pitogo Barangay Hall')
  await dialog.getByRole('combobox', { name: /^Barangay/ }).selectOption(String(session.place_id))
  await dialog.getByLabel('Maximum capacity *', { exact: true }).fill('150')
  await dialog.getByRole('button', { name: 'Assign camp manager' }).click()
  await dialog.getByRole('combobox', { name: /^Camp manager/ }).selectOption(String(session.manager_id))
  await dialog.locator('.islasafe-location-marker').waitFor()
  await dialog.locator('.add-center__picker-canvas').click({ position: { x: 230, y: 160 } })
  const canvasBounds = await dialog.locator('.add-center__picker-canvas').boundingBox()
  const pinBounds = await dialog.locator('.islasafe-location-marker__pin').boundingBox()
  assert(Math.abs(pinBounds.x + pinBounds.width / 2 - canvasBounds.x - 230) < 2)
  assert(Math.abs(pinBounds.y + pinBounds.height / 2 - canvasBounds.y - 160) < 2)
  const latitude = Number(await dialog.getByLabel('Latitude', { exact: true }).inputValue())
  const longitude = Number(await dialog.getByLabel('Longitude', { exact: true }).inputValue())
  assert(latitude > 10 && longitude > 124)
  await page.screenshot({ path: '../.verification/add-center-desktop.png', fullPage: true })
  // Rapid repeated submissions must issue only one create request.
  await dialog.locator('form').evaluate((form) => { form.requestSubmit(); form.requestSubmit() })
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(creationRequests, 1)
  const marker = page.getByRole('button', { name: 'Pitogo Barangay Hall, Pitogo. View evacuation center details' })
  await marker.waitFor()
  await marker.click()
  await page.locator('.evac-map-popup').getByText('Maximum capacity: 150').waitFor()
  const publicFeed = JSON.parse((await request('/api/evacuation-centers')).body)
  assert.equal(publicFeed.data.length, 1)
  assert(Math.abs(publicFeed.data[0].latitude - latitude) < 0.000001)
  assert(Math.abs(publicFeed.data[0].longitude - longitude) < 0.000001)
  const setup = JSON.parse((await request('/api/admin/evacuation/setup')).body).data
  assert.equal(setup.assignments[0].user_id, session.manager_id)
  await page.screenshot({ path: '../.verification/center-marker.png', fullPage: true })
  await page.locator('.evac-map-popup .maplibregl-popup-close-button').click()
  await page.getByRole('button', { name: 'Edit / deactivate center' }).click()
  const edit = page.getByRole('dialog', { name: 'Edit evacuation center', exact: true })
  await edit.getByLabel('Evacuation center name *', { exact: true }).fill('Community Hall')
  await edit.getByRole('combobox', { name: /^Barangay/ }).selectOption('new')
  await edit.getByLabel('New barangay in President Carlos P. Garcia').fill('Tugas')
  await edit.getByLabel('Maximum capacity *', { exact: true }).fill('175')
  await edit.getByLabel('Latitude', { exact: true }).fill('10.118')
  await edit.getByLabel('Longitude', { exact: true }).fill('124.57')
  await edit.getByRole('button', { name: 'Save Evacuation Center' }).click()
  await edit.waitFor({ state: 'hidden' })
  const changedMarker = page.getByRole('button', { name: 'Community Hall, Tugas. View evacuation center details' })
  await changedMarker.waitFor()
  await changedMarker.click()
  await page.locator('.evac-map-popup').getByText('Maximum capacity: 175').waitFor()
  const changedFeed = JSON.parse((await request('/api/evacuation-centers')).body)
  assert.equal(changedFeed.data[0].latitude, 10.118)
  assert.equal(changedFeed.data[0].longitude, 124.57)
  const newPlaceId = changedFeed.data[0].place.id
  const updatedSetup = JSON.parse((await request('/api/admin/evacuation/setup')).body).data
  assert(updatedSetup.assignments[0].place_ids.includes(newPlaceId))
  await page.getByRole('button', { name: 'Edit / deactivate center' }).click()
  await edit.getByRole('combobox', { name: /^Status/ }).selectOption('Closed')
  await edit.getByRole('button', { name: 'Save Evacuation Center' }).click()
  await edit.waitFor({ state: 'hidden' })
  await page.locator('.evac-map-marker[data-status="inactive"]').waitFor()
  assert.equal(JSON.parse((await request('/api/evacuation-centers')).body).data.length, 0)
  await page.getByRole('button', { name: 'Add Center', exact: true }).click()
  await dialog.getByLabel('Evacuation center name *', { exact: true }).fill('  COMMUNITY  HALL ')
  await dialog.getByRole('combobox', { name: /^Barangay/ }).selectOption(String(newPlaceId))
  await dialog.getByLabel('Maximum capacity *', { exact: true }).fill('150')
  await dialog.getByLabel('Latitude', { exact: true }).fill('10.12')
  await dialog.getByLabel('Longitude', { exact: true }).fill('124.55')
  await dialog.getByRole('button', { name: 'Save Evacuation Center' }).click()
  await dialog.getByRole('alert').filter({ hasText: 'already exists' }).waitFor()
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'hidden' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Add Center', exact: true }).click()
  await dialog.waitFor()
  const bounds = await dialog.boundingBox()
  assert(bounds.width <= 390 && bounds.x >= 0 && bounds.height <= 844)
  assert.equal(await dialog.evaluate((node) => node.scrollWidth > node.clientWidth), false)
  await page.screenshot({ path: '../.verification/add-center-mobile.png', fullPage: true })
  await dialog.getByRole('button', { name: 'Save Evacuation Center' }).click()
  assert.equal(await dialog.getByLabel('Evacuation center name *', { exact: true }).evaluate((node) => node.validity.valueMissing), true)
  assert.deepEqual(errors, [])
  console.log('PASS: real Laravel create + manager assignment, rapid-submit prevention, map placement/popup, name/location/barangay edits, synchronized manager coverage, deactivate/public removal, duplicate validation, required fields, responsive modal, no browser errors.')
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0]
  if (page) { await page.screenshot({ path: '../.verification/center-test-failure.png', fullPage: true }); console.error(await page.locator('body').ariaSnapshot()) }
  throw error
} finally {
  await browser.close()
  fixture.stdin.end()
}
