import { useEffect, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
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

/**
 * Six-digit OTP input with paste and keyboard support.
 */
function OtpInput({ onComplete, value, onChange }: { onComplete: (code: string) => void; value: string; onChange: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: 6 }, (_, i) => value[i] ?? ''))

  const updateDigit = (index: number, digit: string) => {
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    const code = next.join('')
    onChange(code)
    if (digit && index < 5) {
      const nextInput = document.querySelector<HTMLInputElement>(`#otp-digit-${index + 1}`)
      nextInput?.focus()
    }
    if (digit && index === 5 && code.length === 6) {
      onComplete(code)
    }
  }

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.querySelector<HTMLInputElement>(`#otp-digit-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      setDigits(Array.from({ length: 6 }, (_, i) => pasted[i] ?? ''))
      onChange(pasted)
      if (pasted.length === 6) onComplete(pasted)
    }
  }

  return (
    <div className="fp-otp-input-group">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`otp-digit-${index}`}
          className="fp-otp-digit"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            updateDigit(index, val.slice(-1))
          }}
          onKeyDown={handleKeyDown(index)}
          onPaste={index === 0 ? handlePaste : undefined}
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

  const otpMinutes = Math.ceil(otpExpiresIn / 60)

  // Ticks once per second while OTP is active
  useEffect(() => {
    if (step === 'email' || step === 'success') return
    const id = window.setInterval(() => {
      setOtpExpiresIn((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [step])

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendAvailableIn <= 0) return
    const timer = window.setInterval(() => {
      setResendAvailableIn((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAvailableIn])

  const requestOtp = async () => {
    if (submitting) return
    const normalized = email.trim()
    if (!normalized) {
      setError('Please enter your email address.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const response = await apiFetch<RequestOtpResponse>('/forgot-password', {
        method: 'POST',
        body: { email: normalized },
      })
      setChallengeId(response.data.challenge_id)
      setOtpExpiresIn(response.data.expires_in)
      setResendAvailableIn(response.data.resend_available_in)
      setStep('otp')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong while sending the verification code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const verifyOtp = async (code: string) => {
    if (submitting) return
    setError('')
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
        setStep('email')
      } else if (caught instanceof Error && caught.message.includes('Too many attempts')) {
        setError('Too many attempts. Please request a new code.')
        setStep('email')
      } else {
        setError(caught instanceof Error ? caught.message : 'The verification code is invalid. Please try again.')
        setOtp('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resendOtp = async () => {
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const response = await apiFetch<ResendOtpResponse>('/forgot-password/resend-otp', {
        method: 'POST',
        body: { challenge_id: challengeId },
      })
      setOtpExpiresIn(response.data.expires_in)
      setResendAvailableIn(response.data.resend_available_in)
      setOtp('')
      setSuccessMessage('A new verification code has been sent.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to resend the verification code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetPassword = async () => {
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
        setStep('email')
        setChallengeId('')
        setResetToken('')
      } else {
        setError(caught instanceof Error ? caught.message : 'Something went wrong while resetting your password. Please try again.')
      }
    } finally {
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
    if (otp.length !== 6) {
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
        <OtpInput onComplete={(code) => void verifyOtp(code)} onChange={setOtp} value={otp} />
        <div className="fp-otp-actions">
          <button className="fp-resend" disabled={submitting || resendAvailableIn > 0} onClick={() => void resendOtp()} type="button"><RefreshCw /> Resend code</button>
          <span className="fp-resends">{resendAvailableIn > 0 ? `Available in ${resendAvailableIn}s` : 'Ready to resend'}</span>
        </div>
        <p className="fp-hint">Code expires in {otpMinutes} minute{otpMinutes !== 1 ? 's' : ''}.</p>
        <button className="action-button-primary action-button-primary--tall action-button-primary--block action-button-primary--text-sm" disabled={submitting || otp.length !== 6} type="submit">{submitting ? 'Verifying…' : 'Verify code'}{!submitting && <ShieldCheck className="action-button__icon action-button__icon--lg" />}</button>
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
