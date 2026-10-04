import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { CinematicIntro } from '../components/CinematicIntro'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import './AuthPage.css'

type AuthMode = 'sign-in' | 'sign-up'

export interface ResetRequest {
  token: string
  email: string
}

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<string | null>
  onRegister: (input: { name: string; email: string; password: string }) => Promise<string | null>
  resetRequest?: ResetRequest | null
  onClearReset?: () => void
}

const authInputClassName = 'auth-input auth-input-field'

function AuthInput({ icon: Icon, label, ...inputProps }: InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; label: string }) {
  return (
    <label className="field">
      <span className="field__label field__label--auth">{label}</span>
      <span className="auth-input-wrap">
        <Icon className="auth-input-icon" />
        <input className={authInputClassName} {...inputProps} />
      </span>
    </label>
  )
}

function LoginPasswordField({ isSignIn, onChange, showPassword, onToggle, value }: { isSignIn: boolean; onChange: (value: string) => void; onToggle: () => void; showPassword: boolean; value: string }) {
  return (
    <label className="field">
      <span className="field__label field__label--auth">Password</span>
      <span className="auth-input-wrap">
        <LockKeyhole className="auth-input-icon" />
        <input autoComplete={isSignIn ? 'current-password' : 'new-password'} className={`${authInputClassName} auth-input-field--trailing`} name={isSignIn ? 'current-password' : 'new-password'} onChange={(event) => onChange(event.target.value)} placeholder="Enter your password" required type={showPassword ? 'text' : 'password'} value={value} />
        <button aria-label={showPassword ? 'Hide password' : 'Show password'} className="auth-password-toggle" onClick={onToggle} type="button">
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </span>
    </label>
  )
}

export function AuthPage({ onSignIn, onRegister, resetRequest = null, onClearReset }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)
  const isSignIn = mode === 'sign-in'

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setShowPassword(false)
    setShowPasswordRecovery(false)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setErrorMessage(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    if (!isSignIn && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    const error = isSignIn
      ? await onSignIn(email, password)
      : await onRegister({ name, email, password })

    if (error) {
      setErrorMessage(error)
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <CinematicIntro />
      <div className="auth-page__bg" />

      <section className="auth-hero">
        <div className="auth-hero__brand">
          <span className="auth-brand-icon"><Activity strokeWidth={2.4} /></span>
          <div><p className="auth-hero__brand-name">IslaSafe</p><p className="auth-hero__brand-tag">MDRRMO OPERATIONS</p></div>
        </div>
        <div className="auth-hero__claim">
          <span className="auth-hero__badge"><ShieldCheck /></span>
          <h1 className="auth-hero__headline">Coordinated response, when every second matters.</h1>
          <p className="auth-hero__copy">A unified workspace for CPG emergency operations, live hazard awareness, evacuation coordination, and resident support.</p>
          <div className="auth-hero__stats">{[['23', 'Barangays'], ['15', 'Centers'], ['24/7', 'Monitoring']].map(([value, label]) => <div className="auth-stat" key={label}><p className="auth-stat__value">{value}</p><p className="auth-stat__label">{label}</p></div>)}</div>
        </div>
        <p className="auth-hero__municipality">Municipality of President Carlos P. Garcia · Bohol</p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="auth-form-brand"><span className="auth-brand-icon auth-brand-icon--compact"><Activity /></span><span><span className="auth-form-brand-name">IslaSafe</span><span className="auth-form-brand-tag">MDRRMO OPERATIONS</span></span></div>
          <div className={`auth-panel auth-card${showPasswordRecovery || resetRequest ? '' : ' auth-card--fill'}`}>
            {resetRequest ? (
              <ResetPasswordForm
                email={resetRequest.email}
                onBackToSignIn={() => onClearReset?.()}
                onRequestNewLink={() => {
                  onClearReset?.()
                  setErrorMessage(null)
                  setShowPasswordRecovery(true)
                }}
                onPasswordReset={() => onClearReset?.()}
                token={resetRequest.token}
              />
            ) : showPasswordRecovery ? <ForgotPasswordForm initialEmail={email} onBackToSignIn={() => setShowPasswordRecovery(false)} /> : <>
              <div className="auth-card__header">
                <div className="auth-secure"><span className="auth-secure__dot" /> Secure portal</div>
                <h2 className="auth-card__title">{isSignIn ? 'Welcome back' : 'Create your account'}</h2>
                <p className="auth-card__subtitle">{isSignIn ? 'Sign in to continue to the operations dashboard.' : 'Register for an IslaSafe account. New accounts start with resident access.'}</p>
              </div>

              <div className="auth-tabs" role="tablist">
                <button aria-selected={isSignIn} className={`auth-tab${isSignIn ? ' is-active' : ''}`} onClick={() => switchMode('sign-in')} role="tab" type="button">Sign in</button>
                <button aria-selected={!isSignIn} className={`auth-tab${!isSignIn ? ' is-active' : ''}`} onClick={() => switchMode('sign-up')} role="tab" type="button">Sign up</button>
              </div>

              <form autoComplete={isSignIn ? 'on' : 'off'} className="stack-4" key={mode} onSubmit={handleSubmit}>
                {!isSignIn && <AuthInput autoComplete="off" icon={UserRound} label="Full name" onChange={(event) => setName(event.target.value)} placeholder="Juan Dela Cruz" required type="text" value={name} />}
                <AuthInput autoComplete={isSignIn ? 'username' : 'off'} icon={Mail} label="Email address" name={isSignIn ? 'username' : 'registration-email'} onChange={(event) => setEmail(event.target.value)} placeholder="name@cpg.gov.ph" required type="email" value={email} />
                <LoginPasswordField isSignIn={isSignIn} onChange={setPassword} onToggle={() => setShowPassword((current) => !current)} showPassword={showPassword} value={password} />
                {!isSignIn && <AuthInput autoComplete="new-password" icon={LockKeyhole} label="Confirm password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required type="password" value={confirmPassword} />}
                {isSignIn && <div className="auth-options"><label className="auth-remember"><input className="auth-checkbox" type="checkbox" /> Remember me</label><button className="auth-link" onClick={() => setShowPasswordRecovery(true)} type="button">Forgot password?</button></div>}
                {errorMessage && <div className="auth-error" role="alert">{errorMessage}</div>}
                <button className="auth-submit" disabled={submitting} type="submit">
                  {submitting ? (isSignIn ? 'Signing in...' : 'Creating account...') : (isSignIn ? 'Sign in to dashboard' : 'Create account and continue')}
                  {submitting ? <Loader2 className="is-spinning" /> : <ArrowRight />}
                </button>
              </form>

              <div className="auth-switch">{isSignIn ? <>New to IslaSafe? <button className="auth-link" onClick={() => switchMode('sign-up')} type="button">Create an account</button></> : <>Already registered? <button className="auth-link" onClick={() => switchMode('sign-in')} type="button">Sign in</button></>}</div>
            </>}
          </div>
          <p className="auth-fineprint"><CheckCircle2 /> Authorized IslaSafe personnel only</p>
        </div>
      </section>
      <footer className="auth-footer">Developed by <span>Four Sisters and a Wedding</span></footer>
    </main>
  )
}
