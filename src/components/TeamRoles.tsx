import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Loader2, Pencil, Trash2, UserPlus } from 'lucide-react'
import { SectionHeading, StatusPill } from './Primitives'
import { environment } from '../config/environment'
import { apiFetch } from '../utils/api'

interface TeamUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'campmanager'
}

function ManagerActions({ account, token, onUpdated, onDeleted }: {
  account: TeamUser
  token: string
  onUpdated: (user: TeamUser) => void
  onDeleted: () => void
}) {
  const [mode, setMode] = useState<'closed' | 'edit' | 'delete'>('closed')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const lock = useRef(false)

  async function mutate(form?: HTMLFormElement) {
    if (lock.current) return
    setError('')
    setMessage('')
    const fields = form ? new FormData(form) : null
    const password = String(fields?.get('password') ?? '')
    if (fields && password !== fields.get('password_confirmation')) {
      setError('Passwords must match.')
      return
    }
    lock.current = true
    setBusy(true)
    try {
      if (fields) {
        const response = await apiFetch<{ user: TeamUser; message: string }>('/admin/team/' + account.id, {
          method: 'PATCH', token,
          body: {
            name: String(fields.get('name')).trim(),
            email: String(fields.get('email')).trim(),
            ...(password ? { password, password_confirmation: fields.get('password_confirmation') } : {}),
          },
        })
        onUpdated(response.user)
        setMessage(response.message)
        setMode('closed')
      } else {
        await apiFetch('/admin/team/' + account.id, { method: 'DELETE', token })
        onDeleted()
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to update account.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  function open(next: typeof mode) {
    setError('')
    setMessage('')
    setMode(next)
  }

  return <div className="team-manager-actions">
    <div className="team-action-buttons">
      <button className="action-button" type="button" disabled={busy} aria-expanded={mode === 'edit'} aria-controls={'manager-edit-' + account.id} aria-label={'Edit ' + account.name} onClick={() => open(mode === 'edit' ? 'closed' : 'edit')}><Pencil size={14} />Edit</button>
      <button className="action-button team-delete-button" type="button" disabled={busy} aria-expanded={mode === 'delete'} aria-controls={'manager-delete-' + account.id} aria-label={'Delete ' + account.name} onClick={() => open(mode === 'delete' ? 'closed' : 'delete')}><Trash2 size={14} />Delete</button>
    </div>
    {mode === 'edit' && <form id={'manager-edit-' + account.id} className="settings-form team-create-form" onSubmit={(event) => { event.preventDefault(); void mutate(event.currentTarget) }}>
      <fieldset disabled={busy} className="team-fields">
        <label className="field"><span className="field__label">Full name</span><span className="field-control"><input name="name" required maxLength={255} defaultValue={account.name} autoComplete="off" /></span></label>
        <label className="field"><span className="field__label">Email address</span><span className="field-control"><input name="email" type="email" required maxLength={255} defaultValue={account.email} autoComplete="off" /></span></label>
        <label className="field"><span className="field__label">New password (optional)</span><span className="field-control"><input name="password" type="password" minLength={8} maxLength={255} autoComplete="new-password" /></span></label>
        <label className="field"><span className="field__label">Confirm new password</span><span className="field-control"><input name="password_confirmation" type="password" minLength={8} maxLength={255} autoComplete="new-password" /></span></label>
      </fieldset>
      <p className="team-detail">Leave passwords blank to keep the current password. Setting a new password signs out existing sessions.</p>
      <div className="team-action-buttons"><button className="action-button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button><button className="action-button" type="button" disabled={busy} onClick={() => open('closed')}>Cancel</button></div>
    </form>}
    {mode === 'delete' && <div id={'manager-delete-' + account.id} className="team-delete-confirmation">
      <p className="team-detail">Delete the account for <strong>{account.name}</strong> ({account.email})? Their login access and center assignment will be removed. Evacuation history will be preserved.</p>
      <div className="team-action-buttons"><button className="action-button team-delete-button" type="button" disabled={busy} onClick={() => { void mutate() }}>{busy ? 'Deleting…' : 'Confirm deletion'}</button><button className="action-button" type="button" disabled={busy} onClick={() => open('closed')}>Cancel</button></div>
    </div>}
    {error && <p className="settings-feedback settings-feedback--error" role="alert">{error}</p>}
    {message && <p className="settings-feedback settings-feedback--success" role="status"><Check />{message}</p>}
  </div>
}

export function TeamRoles({ token }: { token: string }) {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [deletedMessage, setDeletedMessage] = useState('')
  const lock = useRef(false)
  const preview = environment.features.useMockData

  useEffect(() => {
    let ignore = false
    if (preview) return
    apiFetch<{ users: TeamUser[] }>('/admin/team', { token })
      .then(({ users: accounts }) => { if (!ignore) setUsers(accounts) })
      .catch((failure: unknown) => {
        if (!ignore) setLoadError(failure instanceof Error ? failure.message : 'Unable to load team accounts.')
      })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [token, preview, attempt])

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || preview) return
    const form = event.currentTarget
    const fields = new FormData(form)
    setError('')
    setMessage('')
    if (fields.get('password') !== fields.get('password_confirmation')) {
      setError('Passwords must match.')
      return
    }
    lock.current = true
    setSaving(true)
    try {
      const response = await apiFetch<{ user: TeamUser; message: string }>('/admin/team', {
        method: 'POST',
        token,
        body: {
          name: String(fields.get('name')).trim(),
          email: String(fields.get('email')).trim(),
          password: fields.get('password'),
          password_confirmation: fields.get('password_confirmation'),
        },
      })
      setUsers((current) => [...current, response.user])
      setMessage(response.message)
      form.reset()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to create account.')
    } finally {
      lock.current = false
      setSaving(false)
    }
  }

  return (
    <div className="team-roles">
      <SectionHeading title="Team & roles" detail="Manage Admin and Camp Manager accounts." />
      <div className="team-role-cards">
        <div className="team-role-card"><StatusPill tone="success">Admin</StatusPill><p>Manage the web workspace, team accounts, and evacuation operations.</p></div>
        <div className="team-role-card"><StatusPill tone="info">Camp Manager</StatusPill><p>Sign in to the mobile app to access the Camp Manager dashboard.</p></div>
      </div>
      <section aria-labelledby="team-create-title">
        <h3 id="team-create-title" className="settings-row__label">Create Camp Manager account</h3>
        <p className="team-detail">Share the email and password with the Camp Manager securely. Assign their center and authorized places in Evacuation Centers.</p>
        {preview && <p className="settings-feedback" role="status">Account management requires a connected backend. It is unavailable in preview mode.</p>}
        <form className="settings-form team-create-form" onSubmit={(event) => { void createAccount(event) }}>
          <fieldset disabled={saving || preview} className="team-fields">
            <label className="field"><span className="field__label">Full name</span><span className="field-control"><input name="name" required maxLength={255} autoComplete="off" /></span></label>
            <label className="field"><span className="field__label">Email address</span><span className="field-control"><input name="email" type="email" required maxLength={255} autoComplete="off" /></span></label>
            <label className="field"><span className="field__label">Password</span><span className="field-control"><input name="password" type="password" required minLength={8} maxLength={255} autoComplete="new-password" aria-describedby="team-password-hint" /></span></label>
            <label className="field"><span className="field__label">Confirm password</span><span className="field-control"><input name="password_confirmation" type="password" required minLength={8} maxLength={255} autoComplete="new-password" /></span></label>
          </fieldset>
          <p id="team-password-hint" className="team-detail">Use at least 8 characters. The account role is Camp Manager.</p>
          {error && <p className="settings-feedback settings-feedback--error" role="alert">{error}</p>}
          {message && <p className="settings-feedback settings-feedback--success" role="status"><Check />{message}</p>}
          <button className="action-button-primary" type="submit" disabled={saving || preview}>
            {saving ? <><Loader2 className="is-spinning" />Creating account…</> : <><UserPlus />Create Camp Manager</>}
          </button>
        </form>
      </section>
      <section aria-labelledby="team-accounts-title">
        <h3 id="team-accounts-title" className="settings-row__label">Team accounts</h3>
        {deletedMessage && <p className="settings-feedback settings-feedback--success" role="status"><Check />{deletedMessage}</p>}
        {!preview && loading && <p className="team-detail" role="status">Loading accounts…</p>}
        {loadError && <div><p className="settings-feedback settings-feedback--error" role="alert">{loadError}</p><button className="action-button" type="button" onClick={() => { setLoadError(''); setLoading(true); setAttempt((value) => value + 1) }}>Retry</button></div>}
        {!preview && !loading && !loadError && users.length === 0 && <p className="team-detail">No team accounts found.</p>}
        <ul className="team-accounts">
          {users.map((account) => <li className="settings-row team-account" key={account.id}>
            <div className="team-account-heading"><div className="team-account-identity"><p className="settings-row__label">{account.name}</p><p className="settings-row__detail">{account.email}</p></div><StatusPill tone={account.role === 'admin' ? 'success' : 'info'}>{account.role === 'admin' ? 'Admin' : 'Camp Manager'}</StatusPill></div>
            {account.role === 'campmanager' && <ManagerActions account={account} token={token}
              onUpdated={(updated) => { setDeletedMessage(''); setUsers((current) => current.map((user) => user.id === updated.id ? updated : user)) }}
              onDeleted={() => { setUsers((current) => current.filter((user) => user.id !== account.id)); setDeletedMessage(account.name + "'s Camp Manager account has been deleted.") }} />}
          </li>)}
        </ul>
      </section>
    </div>
  )
}
