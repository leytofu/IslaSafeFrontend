import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, Eye, EyeOff, KeyRound, LockKeyhole, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { environment } from '../config/environment'

type ResetStep = 'email' | 'otp' | 'password' | 'success'

const OTP_EXPIRY_MS = 10 * 60 * 1000
const MAX_OTP_ATTEMPTS = 5
const MAX_RESENDS = 3
const registeredPreviewEmails = new Set(['admin.mdrrmo@cpg.gov.ph'])

function createOtp() {
  return String(Math.floor(100_000 + Math.random() * 900_000))
}

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function PasswordField({ confirm, label, onChange, value }: { confirm?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  const [visible, setVisible] = useState(false)
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-300">{label}</span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input autoComplete={confirm ? 'new-password' : 'new-password'} className="auth-input h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-10 pr-11 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/60 focus:bg-white/[0.07]" minLength={8} onChange={(event) => onChange(event.target.value)} placeholder="At least 8 characters" required type={visible ? 'text' : 'password'} value={value} /><button aria-label={visible ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white/8 hover:text-slate-200" onClick={() => setVisible((current) => !current)} type="button">{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
}

interface ForgotPasswordFormProps {
  initialEmail: string
  onBackToSignIn: () => void
}

export function ForgotPasswordForm({ initialEmail, onBackToSignIn }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<ResetStep>('email')
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [issuedOtp, setIssuedOtp] = useState('')
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const otpExpired = remainingSeconds === 0 && expiresAt !== null
  const attemptsRemaining = Math.max(0, MAX_OTP_ATTEMPTS - attempts)
  const isLocked = attempts >= MAX_OTP_ATTEMPTS

  useEffect(() => {
    if (step !== 'otp' || expiresAt === null) return
    const updateTime = () => setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
    updateTime()
    const interval = window.setInterval(updateTime, 1_000)
    return () => window.clearInterval(interval)
  }, [expiresAt, step])

  const issueOtp = (nextResendCount = resendCount) => {
    setIssuedOtp(createOtp())
    setExpiresAt(Date.now() + OTP_EXPIRY_MS)
    setRemainingSeconds(OTP_EXPIRY_MS / 1_000)
    setAttempts(0)
    setOtp('')
    setResendCount(nextResendCount)
    setError('')
    setStep('otp')
  }

  const requestOtp = () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!registeredPreviewEmails.has(normalizedEmail)) {
      setError('No IslaSafe administrator account is registered with that email address.')
      return
    }
    setEmail(normalizedEmail)
    issueOtp(0)
  }

  const verifyOtp = () => {
    if (otpExpired) {
      setError('This verification code has expired. Request a new code to continue.')
      return
    }
    if (isLocked) {
      setError('Too many unsuccessful attempts. Request a new verification code to continue.')
      return
    }
    if (otp !== issuedOtp) {
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      setError(nextAttempts >= MAX_OTP_ATTEMPTS ? 'Too many unsuccessful attempts. Request a new verification code to continue.' : `That verification code is invalid. ${MAX_OTP_ATTEMPTS - nextAttempts} attempts remaining.`)
      return
    }
    setIssuedOtp('')
    setOtp('')
    setError('')
    setStep('password')
  }

  const resetPassword = () => {
    if (newPassword.length < 8) {
      setError('Your new password must contain at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation password do not match.')
      return
    }
    setError('')
    setNewPassword('')
    setConfirmPassword('')
    setStep('success')
  }

  const resendOtp = () => {
    if (resendCount >= MAX_RESENDS) {
      setError('You have reached the resend limit. Please try again later.')
      return
    }
    issueOtp(resendCount + 1)
  }

  const title = step === 'email' ? 'Reset your password' : step === 'otp' ? 'Verify your identity' : step === 'password' ? 'Create a new password' : 'Password updated'
  const detail = step === 'email' ? 'Enter the email address registered to your IslaSafe administrator account.' : step === 'otp' ? `Enter the six-digit code sent to ${email}.` : step === 'password' ? 'Choose a strong password you have not used before.' : 'Your password has been reset. You can now sign in with your new password.'

  return (
    <div>
      <button className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-indigo-200" onClick={onBackToSignIn} type="button"><ArrowLeft className="size-3.5" /> Back to sign in</button>
      <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">Account recovery</p><h2 className="mt-2 font-display text-2xl font-bold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></div>

      {step !== 'success' && <div className="mb-6 flex gap-1.5" aria-label={`Password reset step ${step === 'email' ? 1 : step === 'otp' ? 2 : 3} of 3`}>{['email', 'otp', 'password'].map((item, index) => <span className={`h-1 flex-1 rounded-full ${index <= ['email', 'otp', 'password'].indexOf(step) ? 'bg-indigo-400' : 'bg-white/10'}`} key={item} />)}</div>}
      {error && <p className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-3 text-xs leading-5 text-rose-100" role="alert">{error}</p>}

      {step === 'email' && <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); requestOtp() }}><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-300">Registered email address</span><span className="relative block"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input autoComplete="email" className="auth-input h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/60 focus:bg-white/[0.07]" onChange={(event) => setEmail(event.target.value)} placeholder="name@cpg.gov.ph" required type="email" value={email} /></span></label><button className="action-button-primary h-11 w-full text-sm" type="submit">Send verification code <Mail className="size-4" /></button>{environment.features.useMockData && <p className="rounded-lg border border-indigo-300/15 bg-indigo-400/5 px-3 py-2 text-[10px] leading-4 text-indigo-100/75">Frontend preview: email delivery is simulated. Use <span className="font-mono">admin.mdrrmo@cpg.gov.ph</span> to test this flow, then connect it to the backend before production use.</p>}</form>}

      {step === 'otp' && <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); verifyOtp() }}><div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.07] p-3.5"><p className="flex items-center gap-2 text-xs font-semibold text-indigo-100"><Clock3 className="size-4 text-indigo-300" /> Code expires in <span className="font-mono">{formatRemainingTime(remainingSeconds)}</span></p><p className="mt-1.5 text-[10px] leading-4 text-indigo-200/65">A new code invalidates any earlier code. You have {attemptsRemaining} verification attempts remaining.</p>{environment.features.useMockData && issuedOtp && <p className="mt-2 border-t border-indigo-300/10 pt-2 font-mono text-[10px] text-indigo-100">Preview OTP: {issuedOtp}</p>}</div><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-300">Verification code</span><span className="relative block"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input aria-describedby="otp-help" autoComplete="one-time-code" className="auth-input h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-10 pr-3 font-mono text-base tracking-[0.38em] text-slate-100 outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-indigo-400/60 focus:bg-white/[0.07]" disabled={otpExpired || isLocked} inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="000000" required value={otp} /></span><span className="mt-1.5 block text-[10px] text-slate-500" id="otp-help">Enter the six-digit code from your email.</span></label><button className="action-button-primary h-11 w-full text-sm" disabled={otpExpired || isLocked} type="submit"><ShieldCheck className="size-4" /> Verify code</button><div className="flex items-center justify-between gap-3 text-xs"><button className="font-semibold text-indigo-300 transition hover:text-indigo-200 disabled:cursor-not-allowed disabled:text-slate-600" disabled={resendCount >= MAX_RESENDS} onClick={resendOtp} type="button"><RefreshCw className="mr-1 inline size-3.5" /> Resend code</button><span className="text-[10px] text-slate-500">{resendCount}/{MAX_RESENDS} resends used</span></div></form>}

      {step === 'password' && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); resetPassword() }}><PasswordField label="New password" onChange={setNewPassword} value={newPassword} /><PasswordField confirm label="Confirm new password" onChange={setConfirmPassword} value={confirmPassword} /><p className="text-[10px] leading-4 text-slate-500">Use at least 8 characters. Avoid reusing passwords from other accounts.</p><button className="action-button-primary mt-2 h-11 w-full text-sm" type="submit">Save new password <CheckCircle2 className="size-4" /></button></form>}

      {step === 'success' && <div className="space-y-5"><div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-center"><span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-400/15 text-emerald-200"><CheckCircle2 className="size-6" /></span><p className="mt-3 text-sm font-semibold text-emerald-100">Password reset complete</p><p className="mt-1 text-xs leading-5 text-emerald-100/65">The verification code has been invalidated.</p></div><button className="action-button-primary h-11 w-full text-sm" onClick={onBackToSignIn} type="button">Return to sign in</button></div>}
    </div>
  )
}
