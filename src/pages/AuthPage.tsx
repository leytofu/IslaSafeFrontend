import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type Ref } from 'react'
import { Activity, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Lock, Mail, ShieldCheck } from 'lucide-react'
import { CinematicIntro } from '../components/CinematicIntro'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import './AuthPage.css'

export interface ResetRequest {
  token: string
  email: string
}

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<string | null>
  resetRequest?: ResetRequest | null
  onClearReset?: () => void
}

const authInputClassName = 'auth-input auth-input-field'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: typeof Mail
  label: string
  invalid?: boolean
  describedBy?: string
  inputRef?: Ref<HTMLInputElement>
}

function AuthInput({ icon: Icon, label, invalid, describedBy, inputRef, ...inputProps }: AuthInputProps) {
  return (
    <label className="field">
      <span className="field__label field__label--auth">{label}</span>
      <span className="auth-input-wrap">
        <Icon className="auth-input-icon" />
        <input aria-describedby={describedBy} aria-invalid={invalid || undefined} className={`${authInputClassName}${invalid ? ' is-invalid' : ''}`} ref={inputRef} {...inputProps} />
      </span>
    </label>
  )
}

function LoginPasswordField({ capsLockOn, onChange, onCapsLockChange, onToggle, showPassword, value }: { capsLockOn: boolean; onChange: (value: string) => void; onCapsLockChange: (on: boolean) => void; onToggle: () => void; showPassword: boolean; value: string }) {
  const detectCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    onCapsLockChange(event.getModifierState('CapsLock'))
  }

  return (
    <label className="field">
      <span className="field__label field__label--auth">Password</span>
      <span className="auth-input-wrap">
        <LockKeyhole className="auth-input-icon" />
        <input
          autoComplete="current-password"
          className={`${authInputClassName} auth-input-field--trailing`}
          name="current-password"
          onChange={(event) => onChange(event.target.value)}
          onKeyUp={detectCapsLock}
          onKeyDown={detectCapsLock}
          onBlur={() => onCapsLockChange(false)}
          placeholder="Enter your password"
          required
          type={showPassword ? 'text' : 'password'}
          value={value}
        />
        <button aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="auth-password-toggle" onClick={onToggle} type="button">
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </span>
      {capsLockOn && (
        <span className="auth-caps" role="status">
          <AlertCircle /> Caps Lock is on
        </span>
      )}
    </label>
  )
}

export function AuthPage({ onSignIn, resetRequest = null, onClearReset }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Focus the email field as soon as the sign-in form is usable.
  useEffect(() => {
    if (!showPasswordRecovery && !resetRequest) {
      emailInputRef.current?.focus()
    }
  }, [showPasswordRecovery, resetRequest])

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email address is required.')
      return false
    }
    if (!EMAIL_PATTERN.test(value.trim())) {
      setEmailError('Enter a valid email address.')
      return false
    }
    setEmailError(null)
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    if (!validateEmail(email)) {
      emailInputRef.current?.focus()
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    const error = await onSignIn(email.trim(), password)

    if (error) {
      setErrorMessage(error)
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <CinematicIntro />
      <div className="auth-page__bg" />
      <div aria-hidden="true" className="auth-orb auth-orb--one" />
      <div aria-hidden="true" className="auth-orb auth-orb--two" />

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
                <div className="auth-secure"><span className="auth-secure__dot" /> Secure admin portal</div>
                <h2 className="auth-card__title">Welcome back</h2>
                <p className="auth-card__subtitle">Sign in to continue to the operations dashboard.</p>
              </div>

              <form autoComplete="on" className="stack-4" noValidate onSubmit={handleSubmit}>
                <AuthInput
                  autoComplete="username"
                  describedBy={emailError ? 'auth-email-error' : undefined}
                  icon={Mail}
                  invalid={Boolean(emailError)}
                  label="Email address"
                  name="username"
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (emailError) setEmailError(null)
                  }}
                  placeholder="name@cpg.gov.ph"
                  inputRef={emailInputRef}
                  required
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  type="email"
                  value={email}
                />
                {emailError && <p className="auth-field-error" id="auth-email-error" role="alert">{emailError}</p>}
                <LoginPasswordField capsLockOn={capsLockOn} onChange={setPassword} onCapsLockChange={setCapsLockOn} onToggle={() => setShowPassword((current) => !current)} showPassword={showPassword} value={password} />
                <div className="auth-options">
                  <label className="auth-remember"><input className="auth-checkbox" type="checkbox" /><span aria-hidden="true" className="auth-checkbox__mark" /> Remember me</label>
                  <button className="auth-link" onClick={() => setShowPasswordRecovery(true)} type="button">Forgot password?</button>
                </div>
                {errorMessage && <div aria-live="polite" className="auth-error" role="alert"><AlertCircle className="auth-error__icon" /><span>{errorMessage}</span></div>}
                <button aria-busy={submitting} className="auth-submit" disabled={submitting} type="submit">
                  {submitting ? 'Signing in...' : 'Sign in to dashboard'}
                  {submitting ? <Loader2 className="is-spinning" /> : <ArrowRight className="auth-submit__arrow" />}
                </button>
              </form>

              <div className="auth-trust" aria-hidden="true">
                <span><Lock /> Encrypted session</span>
                <span className="auth-trust__sep" />
                <span><ShieldCheck /> Role-based access</span>
              </div>

              <p className="auth-signup-note">Administrator accounts are provisioned by the MDRRMO system administrator.</p>
            </>}
          </div>
          <p className="auth-fineprint"><CheckCircle2 /> Authorized IslaSafe personnel only</p>
        </div>
      </section>
      <footer className="auth-footer">Developed by <span>Four Sisters and a Wedding</span></footer>
    </main>
  )
}
