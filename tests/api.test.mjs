import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Run the actual client with browser/network ports and a fixed API environment.
const source = ts.transpileModule(readFileSync(new URL('../src/utils/api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
function client(respond, cookie = 'XSRF-TOKEN=csrf%3Dvalue') {
  const calls = []
  const events = []
  const document = { cookie }
  const exports = {}
  runInNewContext(source, {
    exports, require: () => ({ environment: { api: { baseUrl: 'https://api.example.test/api', timeoutMs: 1000 } } }),
    window: { location: { origin: 'https://admin.example.test' }, setTimeout, clearTimeout, dispatchEvent: (event) => events.push(event) },
    document, URL, FormData, AbortController, AbortSignal, DOMException, CustomEvent,
    fetch: async (url, options) => { calls.push({ url: String(url), options }); return respond(String(url), options, document) },
  })
  return { ...exports, calls, events }
}
const json = (payload, status = 200) => new Response(JSON.stringify(payload), { status })

test('web reads authenticate with cookies and never send bearer credentials or the local generation key', async () => {
  const api = client(() => json({ user: { id: 1 } }))
  await api.apiFetch('/auth/me', { sessionKey: 'local-generation' })
  assert.equal(api.calls[0].options.credentials, 'include')
  assert.equal(api.calls[0].options.headers.Authorization, undefined)
  assert.equal(JSON.stringify(api.calls).includes('local-generation'), false)
})

test('web mutations send the decoded CSRF cookie with credentials', async () => {
  const api = client(() => json({ message: 'ok' }))
  await api.apiFetch('/admin/team', { method: 'POST', body: { name: 'Manager' } })
  assert.equal(api.calls[0].options.headers['X-XSRF-TOKEN'], 'csrf=value')
  assert.equal(api.calls[0].options.headers['Content-Type'], 'application/json')
  assert.equal(api.calls[0].options.credentials, 'include')
})

test('missing CSRF cookie is initialized on the backend before sending a mutation', async () => {
  const api = client((url, options, document) => {
    if (url.endsWith('/sanctum/csrf-cookie')) {
      assert.equal(options.credentials, 'include')
      document.cookie = 'XSRF-TOKEN=fresh'
      return new Response(null, { status: 204 })
    }
    assert.equal(options.headers['X-XSRF-TOKEN'], 'fresh')
    return json({})
  }, '')
  await api.apiFetch('/auth/web/login', { method: 'POST', body: { email: 'admin@example.test' } })
  assert.deepEqual(api.calls.map((call) => call.url), ['https://api.example.test/sanctum/csrf-cookie', 'https://api.example.test/api/auth/web/login'])
})

test('failed CSRF initialization stops the mutation', async () => {
  const api = client(() => json({ message: 'unavailable' }, 503), '')
  await assert.rejects(api.apiFetch('/auth/web/login', { method: 'POST' }), (error) => error.status === 503)
  assert.equal(api.calls.length, 1)
})

test('multipart profile uploads preserve browser boundaries and include CSRF', async () => {
  const api = client(() => json({}))
  const body = new FormData()
  body.set('name', 'Admin')
  await api.apiFetch('/auth/profile', { method: 'PATCH', body })
  assert.equal(api.calls[0].options.body, body)
  assert.equal(api.calls[0].options.headers['Content-Type'], undefined)
  assert.equal(api.calls[0].options.headers['X-XSRF-TOKEN'], 'csrf=value')
})

test('unauthorized responses signal the request generation and rejected writes are never replayed', async () => {
  const api = client(() => json({ message: 'Unauthenticated.' }, 401))
  await assert.rejects(api.apiFetch('/auth/me', { sessionKey: 'previous-session' }), (error) => error.status === 401)
  assert.equal(api.events[0].type, 'islasafe:unauthenticated')
  assert.equal(api.events[0].detail, 'previous-session')
  const rejected = client(() => json({ message: 'CSRF token mismatch.' }, 419))
  await assert.rejects(rejected.apiFetch('/admin/team', { method: 'POST', body: {} }), (error) => error.status === 419)
  assert.equal(rejected.calls.length, 1)
})
