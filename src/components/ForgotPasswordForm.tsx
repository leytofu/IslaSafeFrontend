import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { ApiError, apiFetch } from '../utils/api'
import { completeOtp, otpDigits, replaceOtpDigit } from '../utils/otp'
import './ForgotPasswordForm.css'

/**
 * Shared password input with a visibility toggle. Also used by
 * ResetPasswordForm so both screens share the exact same field design.
 */
export function PasswordField({ confirm, label, onChange, value }: { confirm?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  const [visible, setVisible] = useState(false)
  return <label className="field"><span className="field__label field__label--light">{label}</span><span className="fp-field"><LockKeyhole className="fp-field__icon" /><input autoComplete={confirm ? 'new-password' : 'new-password'} className="auth-input fp-input fp-input--trailing" minLength={8} onChange={(event) => onChange(event.target.value)} placeholder="At least 8 characters" required type={visible ? 'text' : 'password'} value={value} /><button aria-label={visible ? 'Hide password' : 'Show password'} className="fp-toggle" onClick={() => setVisible((current) => !current)} type="button">{visible ? <EyeOff /> : <Eye />}</button></span></label>
}

/**
 * Six-digit OTP input with paste and keyboard support.
 */
function OtpInput({ disabled, onComplete, value, onChange }: { disabled: boolean; onComplete: (code: string) => void; value: string; onChange: (code: string) => void }) {
  const digits = otpDigits(value)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => {
    if (!value && !disabled) inputs.current[0]?.focus()
  }, [value, disabled])

  const updateDigit = (index: number, digit: string) => {
    const code = replaceOtpDigit(value, index, digit)
    onChange(code)
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus()
    }
    if (completeOtp(code)) {
      onComplete(code)
    }
  }

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted)
      inputs.current[Math.min(pasted.length, 5)]?.focus()
      if (pasted.length === 6) onComplete(pasted)
    }
  }

  return (
    <div className="fp-otp-input-group">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`otp-digit-${index}`}
          ref={(element) => { inputs.current[index] = element }}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          className="fp-otp-digit"
          inputMode="numeric"
          maxLength={index === 0 ? 6 : 1}
          value={digit}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            if (completeOtp(val)) { onChange(val); onComplete(val); return }
            updateDigit(index, val.slice(-1))
          }}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste}
          aria-label={`Digit ${index + 1}`}
          autoFocus={index === 0}
        />
      ))}
    </div>
  )
}

interface ForgotPasswordFormProps {
  initialEmail: string
  onBackToSignIn: () => void
}

interface RequestOtpResponse {
  success: boolean
  message: string
  data: {
    challenge_id: string
    expires_in: number
    resend_available_in: number
  }
}

interface VerifyOtpResponse {
  success: boolean
  message: string
  data: {
    reset_token: string
    expires_in: number
  }
}

interface ResendOtpResponse {
  success: boolean
  message: string
  data: {
    expires_in: number
    resend_available_in: number
  }
}

export function ForgotPasswordForm({ initialEmail, onBackToSignIn }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email')
  const [email, setEmail] = useState(initialEmail)
  const [challengeId, setChallengeId] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [otpExpiresIn, setOtpExpiresIn] = useState(300)
  const [resendAvailableIn, setResendAvailableIn] = useState(0)
  const inFlight = useRef(false)
  const otpDeadline = useRef(0)
  const resendDeadline = useRef(0)

  const otpMinutes = Math.ceil(otpExpiresIn / 60)

  // Deadlines remain correct after a browser tab has been backgrounded.
  useEffect(() => {
    if (step !== 'otp') return
    const tick = () => {
      setOtpExpiresIn(Math.max(0, Math.ceil((otpDeadline.current - Date.now()) / 1000)))
      setResendAvailableIn(Math.max(0, Math.ceil((resendDeadline.current - Date.now()) / 1000)))
    }
    const id = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [step])

  // Countdown for resend cooldown
  useEffect(() => {
    if (!successMessage || step === 'success') return
    const timer = window.setTimeout(() => setSuccessMessage(''), 3000)
    return () => window.clearTimeout(timer)
  }, [successMessage, step])

  const restartRecovery = () => {
    setStep('email'); setChallengeId(''); setResetToken(''); setOtp('')
    setNewPassword(''); setConfirmPassword(''); setSuccessMessage('')
  }

  const requestOtp = async () => {
    if (inFlight.current) return
    const normalized = email.trim()
    if (!normalized) {
      setError('Please enter your email address.')
      return
    }
    setError('')
    inFlight.current = true
    setSubmitting(true)
    try {
      const response = await apiFetch<RequestOtpResponse>('/forgot-password', {
        method: 'POST',
        body: { email: normalized },
        timeoutMs: 45_000,
      })
      setChallengeId(response.data.challenge_id)
      setOtpExpiresIn(response.data.expires_in)
      setResendAvailableIn(response.data.resend_available_in)
      otpDeadline.current = Date.now() + response.data.expires_in * 1000
      resendDeadline.current = Date.now() + response.data.resend_available_in * 1000
      setEmail(normalized)
      setOtp('')
      setStep('otp')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong while sending the verification code. Please try again.')
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  const verifyOtp = async (code: string) => {
    if (inFlight.current || !completeOtp(code)) return
    setError('')
    inFlight.current = true
    setSubmitting(true)
    try {
      const response = await apiFetch<VerifyOtpResponse>('/forgot-password/verify-otp', {
        method: 'POST',
        body: { challenge_id: challengeId, otp: code },
      })
      setResetToken(response.data.reset_token)
      setStep('password')
    } catch (caught) {
      if (caught instanceof Error && caught.message.includes('expired')) {
        setError('This verification request has expired. Please request a new code.')
        restartRecovery()
      } else if (caught instanceof Error && caught.message.includes('Too many attempts')) {
        setError('Too many attempts. Please request a new code.')
        restartRecovery()
      } else {
        setError(caught instanceof Error ? caught.message : 'The verification code is invalid. Please try again.')
        setOtp('')
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  const resendOtp = async () => {
    if (inFlight.current || resendAvailableIn > 0) return
    setError('')
    inFlight.current = true
    setSubmitting(true)
    try {
      const response = await apiFetch<ResendOtpResponse>('/forgot-password/resend-otp', {
        method: 'POST',
        body: { challenge_id: challengeId },
        timeoutMs: 45_000,
      })
      setOtpExpiresIn(response.data.expires_in)
      setResendAvailableIn(response.data.resend_available_in)
      otpDeadline.current = Date.now() + response.data.expires_in * 1000
      resendDeadline.current = Date.now() + response.data.resend_available_in * 1000
      setOtp('')
      setSuccessMessage('A new verification code has been sent.')
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 410) restartRecovery()
      setError(caught instanceof Error ? caught.message : 'Failed to resend the verification code. Please try again.')
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  const resetPassword = async () => {
    if (inFlight.current) return
    setError('')

    if (newPassword.length < 8) {
      setError('Your new password must contain at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation password do not match.')
      return
    }

    inFlight.current = true
    setSubmitting(true)
    try {
      await apiFetch('/forgot-password/reset', {
        method: 'POST',
        body: {
          reset_token: resetToken,
          password: newPassword,
          password_confirmation: confirmPassword,
        },
      })
      setSuccessMessage('Your password has been reset successfully.')
      setStep('success')
    } catch (caught) {
      if (caught instanceof Error && caught.message.includes('invalid or has expired')) {
        setError('This password reset request is invalid or has expired. Please restart the password recovery process.')
        restartRecovery()
      } else {
        setError(caught instanceof Error ? caught.message : 'Something went wrong while resetting your password. Please try again.')
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    void requestOtp()
  }

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!completeOtp(otp)) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }
    void verifyOtp(otp)
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    void resetPassword()
  }

  const progressDone = step === 'email' ? 1 : step === 'otp' ? 2 : 3

  return (
    <div>
      <button className="fp-back" onClick={onBackToSignIn} type="button"><ArrowLeft /> Back to sign in</button>
      <div className="fp-header"><p className="modal-eyebrow">Account recovery</p><h2 className="fp-title">Reset your password</h2><p className="fp-detail">{step === 'email' ? 'Enter the email address registered to your IslaSafe account and we will send you a verification code.' : step === 'otp' ? 'Enter the verification code sent to your email address.' : 'Choose a new password for your account.'}</p></div>

      <div className="fp-progress" aria-label={`Password reset step ${progressDone} of 3`}>{['request', 'verify', 'reset'].map((item, index) => <span className={`fp-progress__step${index < progressDone ? ' is-done' : ''}`} key={item} />)}</div>
      {error && <p className="fp-error" role="alert">{error}</p>}
      {successMessage && <p className="fp-success-toast" role="status">{successMessage}</p>}

      {step === 'email' && <form className="stack-5" onSubmit={handleEmailSubmit}>
        <label className="field">
          <span className="field__label field__label--light">Registered email address</span>
          <span className="fp-field"><Mail className="fp-field__icon" /><input autoComplete="email" className="auth-input fp-input" onChange={(event) => setEmail(event.target.value)} placeholder="name@cpg.gov.ph" required type="email" value={email} /></span>
        </label>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" disabled={submitting} type="submit">{submitting ? 'Sending code…' : 'Send verification code'}{!submitting && <Mail className="action-button__icon action-button__icon--lg" />}</button>
      </form>}

      {step === 'otp' && <form className="stack-5" onSubmit={handleOtpSubmit}>
        <div className="fp-otp-info">
          <ShieldCheck className="fp-otp-info__icon" />
          <p>We sent a 6-digit verification code to <span className="fp-mono">{email}</span>. Enter it below to verify your identity.</p>
        </div>
        <OtpInput disabled={submitting} onComplete={(code) => void verifyOtp(code)} onChange={setOtp} value={otp} />
        <div className="fp-otp-actions">
          <button className="fp-resend" disabled={submitting || (otpExpiresIn > 0 && resendAvailableIn > 0)} onClick={() => { if (otpExpiresIn === 0) restartRecovery(); else void resendOtp() }} type="button"><RefreshCw /> {otpExpiresIn === 0 ? 'Request a new code' : 'Resend code'}</button>
          <span className="fp-resends">{resendAvailableIn > 0 ? `Available in ${resendAvailableIn}s` : 'Ready to resend'}</span>
        </div>
        <p className="fp-hint">{otpExpiresIn === 0 ? 'This code has expired. Request a new code to continue.' : `Code expires in ${otpMinutes} minute${otpMinutes !== 1 ? 's' : ''}.`}</p>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" disabled={submitting || !completeOtp(otp) || otpExpiresIn === 0} type="submit">{submitting ? 'Verifying…' : 'Verify code'}{!submitting && <ShieldCheck className="action-button__icon action-button__icon--lg" />}</button>
      </form>}

      {step === 'password' && <form className="stack-4" onSubmit={handlePasswordSubmit}>
        <div className="fp-otp-info fp-otp-info--success">
          <CheckCircle2 className="fp-otp-info__icon" />
          <p>Email verified. Create a new password for your account.</p>
        </div>
        <PasswordField label="New password" onChange={setNewPassword} value={newPassword} />
        <PasswordField confirm label="Confirm new password" onChange={setConfirmPassword} value={confirmPassword} />
        <p className="fp-hint">Use at least 8 characters. Avoid reusing passwords from other accounts.</p>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" disabled={submitting} type="submit">{submitting ? 'Saving password…' : 'Save new password'}{!submitting && <CheckCircle2 className="action-button__icon action-button__icon--lg" />}</button>
      </form>}

      {step === 'success' && <div className="stack-5">
        <div className="fp-success">
          <span className="fp-success__icon"><CheckCircle2 /></span>
          <p className="fp-success__title">Password updated</p>
          <p className="fp-success__detail">Your password has been changed successfully. You can now sign in with your new password.</p>
        </div>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" onClick={onBackToSignIn} type="button">Continue to sign in</button>
      </div>}
    </div>
  )
}
