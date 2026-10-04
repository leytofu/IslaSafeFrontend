import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, RefreshCw } from 'lucide-react'
import { apiFetch } from '../utils/api'
import './ForgotPasswordForm.css'

/**
 * Shared password input with a visibility toggle. Also used by
 * ResetPasswordForm so both screens share the exact same field design.
 */
export function PasswordField({ confirm, label, onChange, value }: { confirm?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  const [visible, setVisible] = useState(false)
  return <label className="field"><span className="field__label field__label--light">{label}</span><span className="fp-field"><LockKeyhole className="fp-field__icon" /><input autoComplete={confirm ? 'new-password' : 'new-password'} className="auth-input fp-input fp-input--trailing" minLength={8} onChange={(event) => onChange(event.target.value)} placeholder="At least 8 characters" required type={visible ? 'text' : 'password'} value={value} /><button aria-label={visible ? 'Hide password' : 'Show password'} className="fp-toggle" onClick={() => setVisible((current) => !current)} type="button">{visible ? <EyeOff /> : <Eye />}</button></span></label>
}

interface ForgotPasswordFormProps {
  initialEmail: string
  onBackToSignIn: () => void
}

interface ForgotPasswordResponse {
  message: string
  expires_in_minutes: number
  resend_after_seconds: number
}

export function ForgotPasswordForm({ initialEmail, onBackToSignIn }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [expiresInMinutes, setExpiresInMinutes] = useState(60)
  const [resendDeadline, setResendDeadline] = useState(0)
  const [clock, setClock] = useState(() => Date.now())

  const resendIn = Math.max(0, Math.ceil((resendDeadline - clock) / 1000))

  // Ticks once per second while a resend cooldown is active.
  useEffect(() => {
    if (resendDeadline <= Date.now()) return
    const id = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [resendDeadline, clock])

  const requestLink = async (targetEmail: string) => {
    if (submitting) return
    const normalized = targetEmail.trim()
    setError('')
    setSubmitting(true)
    try {
      const response = await apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: { email: normalized },
      })
      setSentTo(normalized)
      setExpiresInMinutes(response.expires_in_minutes || 60)
      setResendDeadline(Date.now() + (response.resend_after_seconds || 60) * 1000)
      setClock(Date.now())
      setStep('sent')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong while sending the reset link. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    void requestLink(email)
  }

  const progressDone = step === 'email' ? 1 : 2

  return (
    <div>
      <button className="fp-back" onClick={onBackToSignIn} type="button"><ArrowLeft /> Back to sign in</button>
      <div className="fp-header"><p className="modal-eyebrow">Account recovery</p><h2 className="fp-title">Reset your password</h2><p className="fp-detail">Enter the email address registered to your IslaSafe account and we will send you a secure reset link.</p></div>

      <div className="fp-progress" aria-label={`Password reset step ${progressDone} of 3`}>{['request', 'email', 'reset'].map((item, index) => <span className={`fp-progress__step${index < progressDone ? ' is-done' : ''}`} key={item} />)}</div>
      {error && <p className="fp-error" role="alert">{error}</p>}

      {step === 'email' && <form className="stack-5" onSubmit={handleSubmit}><label className="field"><span className="field__label field__label--light">Registered email address</span><span className="fp-field"><Mail className="fp-field__icon" /><input autoComplete="email" className="auth-input fp-input" onChange={(event) => setEmail(event.target.value)} placeholder="name@cpg.gov.ph" required type="email" value={email} /></span></label><button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" disabled={submitting} type="submit">{submitting ? 'Sending link…' : 'Send reset link'}{!submitting && <Mail className="action-button__icon action-button__icon--lg" />}</button></form>}

      {step === 'sent' && <div className="stack-5">
        <div className="fp-success">
          <span className="fp-success__icon"><Mail /></span>
          <p className="fp-success__title">Check your inbox</p>
          <p className="fp-success__detail">We sent a password reset link to <span className="fp-mono">{sentTo}</span>. Open it within {expiresInMinutes} minutes to choose a new password.</p>
        </div>
        <div className="fp-otp-actions">
          <button className="fp-resend" disabled={submitting || resendIn > 0} onClick={() => void requestLink(sentTo)} type="button"><RefreshCw /> Resend link</button>
          <span className="fp-resends">{resendIn > 0 ? `Available in ${resendIn}s` : 'Ready to resend'}</span>
        </div>
        <p className="fp-hint">The link can only be used once. If the email does not arrive, check your spam folder.</p>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" onClick={onBackToSignIn} type="button">Back to sign in</button>
      </div>}
    </div>
  )
}
