import { useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '../utils/api'
import { PasswordField } from './ForgotPasswordForm'
import './ForgotPasswordForm.css'

interface ResetPasswordFormProps {
  token: string
  email: string
  onBackToSignIn: () => void
  onRequestNewLink: () => void
  onPasswordReset: () => void
}

/**
 * Final step of the recovery flow: reached from the emailed reset link
 * (/reset-password?token=...&email=...). Exchanges the one-time token for a
 * new password via POST /api/auth/reset-password.
 */
export function ResetPasswordForm({ token, email, onBackToSignIn, onRequestNewLink, onPasswordReset }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const linkValid = token.trim() !== '' && email.trim() !== ''

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setError('')

    if (newPassword.length < 8) {
      setError('Your new password must contain at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation password do not match.')
      return
    }

    setSubmitting(true)
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token, email, password: newPassword, password_confirmation: confirmPassword },
      })
      setDone(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong while resetting your password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!linkValid) {
    return (
      <div>
        <div className="fp-header"><p className="modal-eyebrow">Account recovery</p><h2 className="fp-title">Set a new password</h2></div>
        <div className="stack-5">
          <p className="fp-error" role="alert">This password reset link is missing or incomplete. Open the link from your email again, or request a new one.</p>
          <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" onClick={onRequestNewLink} type="button">Request a new link</button>
          <button className="action-button action-button--tall action-button--block" onClick={onBackToSignIn} type="button">Back to sign in</button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="stack-5">
        <div className="fp-success">
          <span className="fp-success__icon"><CheckCircle2 /></span>
          <p className="fp-success__title">Password updated</p>
          <p className="fp-success__detail">Your password has been changed. You can now sign in with your new password.</p>
        </div>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" onClick={onPasswordReset} type="button">Continue to sign in</button>
      </div>
    )
  }

  return (
    <div>
      <button className="fp-back" onClick={onBackToSignIn} type="button"><ArrowLeft /> Back to sign in</button>
      <div className="fp-header"><p className="modal-eyebrow">Account recovery</p><h2 className="fp-title">Set a new password</h2><p className="fp-detail">Choose a new password for <span className="fp-mono">{email}</span>.</p></div>

      <div className="fp-progress" aria-label="Password reset step 3 of 3">
        <span className="fp-progress__step is-done" />
        <span className="fp-progress__step is-done" />
        <span className="fp-progress__step" />
      </div>
      {error && <p className="fp-error" role="alert">{error}</p>}

      <form className="stack-4" onSubmit={handleSubmit}>
        <PasswordField label="New password" onChange={setNewPassword} value={newPassword} />
        <PasswordField confirm label="Confirm new password" onChange={setConfirmPassword} value={confirmPassword} />
        <p className="fp-hint">Use at least 8 characters. Avoid reusing passwords from other accounts.</p>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm action-button-primary--mt2" disabled={submitting} type="submit">{submitting ? 'Saving password…' : 'Save new password'}{!submitting && <CheckCircle2 className="action-button__icon action-button__icon--lg" />}</button>
      </form>
    </div>
  )
}
