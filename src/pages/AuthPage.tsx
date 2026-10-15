import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type KeyboardEvent, type Ref } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, MapPinned, Radio, ShieldCheck, Users } from 'lucide-react'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import { CinematicIntro } from '../components/CinematicIntro'
import './AuthPage.css'

export interface ResetRequest {
  token: string
  email: string
}

interface AuthPageProps {
  onSignIn: (email: string, password: string, remember: boolean) => Promise<string | null>
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

function LoginPasswordField({ capsLockOn, disabled, error, inputRef, onChange, onCapsLockChange, onToggle, showPassword, value }: { capsLockOn: boolean; disabled: boolean; error: string | null; inputRef: Ref<HTMLInputElement>; onChange: (value: string) => void; onCapsLockChange: (on: boolean) => void; onToggle: () => void; showPassword: boolean; value: string }) {
  const detectCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    onCapsLockChange(event.getModifierState('CapsLock'))
  }

  return (
    <label className="field">
      <span className="field__label field__label--auth">Password</span>
      <span className="auth-input-wrap">
        <LockKeyhole className="auth-input-icon" />
        <input
          aria-describedby={error ? 'auth-password-error' : undefined}
          aria-invalid={Boolean(error) || undefined}
          autoComplete="current-password"
          className={`${authInputClassName} auth-input-field--trailing`}
          disabled={disabled}
          ref={inputRef}
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
        <button aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="auth-password-toggle" disabled={disabled} onClick={onToggle} type="button">
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </span>
      {error && <span className="auth-field-error" id="auth-password-error" role="alert">{error}</span>}
      {capsLockOn && (
        <span className="auth-caps" role="status">
          <AlertCircle /> Caps Lock is on
        </span>
      )}
    </label>
  )
}

export function AuthPage({ onSignIn, resetRequest = null, onClearReset }: AuthPageProps) {
  const [introComplete, setIntroComplete] = useState(Boolean(resetRequest))
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Focus the email field as soon as the sign-in form is usable.
  useEffect(() => {
    if (introComplete && !showPasswordRecovery && !resetRequest) {
      emailInputRef.current?.focus()
    }
  }, [introComplete, showPasswordRecovery, resetRequest])

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

    if (!password) {
      setPasswordError('Enter your password to continue.')
      passwordInputRef.current?.focus()
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const error = await onSignIn(email.trim(), password, rememberMe)
      if (error) setErrorMessage(error)
    } catch {
      setErrorMessage('Unable to sign in right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      {!introComplete && <CinematicIntro onComplete={setIntroComplete} />}
      <div className="auth-page__bg" />
      <div className="auth-shell">
        <header className="auth-shell__header" inert={!introComplete}>
        <div className="auth-hero__brand">
          <span className="auth-brand-icon"><img className="auth-brand-image" src="/app-logo.png" alt="Municipality of President Carlos P. Garcia seal" /></span>
          <div><p className="auth-hero__brand-name">IslaSafe</p><p className="auth-hero__brand-tag">MDRRMO OPERATIONS</p></div>
        </div>
        <span className="auth-shell__caption"><ShieldCheck aria-hidden="true" /> Municipal disaster coordination</span>
        </header>
      <section className="auth-hero" inert={!introComplete}>
        <div className="auth-hero__claim">
          <span className="auth-hero__eyebrow"><span /> MUNICIPAL EMERGENCY OPERATIONS</span>
          <h1 className="auth-hero__headline">A connected team.<br /><span>A safer island.</span></h1>
          <p className="auth-hero__copy">Bring awareness, coordination, and community support together. Your workspace for every stage of emergency response.</p>
          <div className="auth-capabilities">
            {[{ icon: Radio, title: 'Stay informed', detail: 'Hazard awareness and incident monitoring' }, { icon: MapPinned, title: 'Coordinate response', detail: 'Evacuation centers and emergency requests' }, { icon: Users, title: 'Support your community', detail: 'Resident information and public advisories' }].map(({ icon: Icon, title, detail }) => (
              <div className="auth-capability" key={title}><span className="auth-capability__icon"><Icon aria-hidden="true" /></span><div><h2>{title}</h2><p>{detail}</p></div></div>
            ))}
          </div>
        </div>
        <p className="auth-hero__municipality">Municipality of President Carlos P. Garcia · Bohol</p>
      </section>

      <section className="auth-form-section" inert={!introComplete}>
        <div className="auth-form-wrap">
          <div className="auth-panel auth-card">
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
                <div className="auth-secure"><ShieldCheck aria-hidden="true" /> ADMINISTRATOR ACCESS</div>
                <h2 className="auth-card__title">Welcome back</h2>
                <p className="auth-card__subtitle">Sign in to continue to the operations dashboard.</p>
              </div>

              <form aria-busy={submitting} autoComplete="on" className="auth-login-form" noValidate onSubmit={handleSubmit}>
                <AuthInput
                  autoComplete="username"
                  describedBy={emailError ? 'auth-email-error' : undefined}
                  disabled={submitting}
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
                <LoginPasswordField capsLockOn={capsLockOn} disabled={submitting} error={passwordError} inputRef={passwordInputRef} onChange={(value) => { setPassword(value); setPasswordError(null) }} onCapsLockChange={setCapsLockOn} onToggle={() => setShowPassword((current) => !current)} showPassword={showPassword} value={password} />
                <div className="auth-options">
                  <label className="auth-remember" title="Keep me signed in after reopening the browser"><input type="checkbox" checked={rememberMe} disabled={submitting} onChange={(event) => setRememberMe(event.target.checked)} /><span>Remember me</span></label>
                  <button className="auth-link" disabled={submitting} onClick={() => setShowPasswordRecovery(true)} type="button">Forgot password?</button>
                </div>
                {errorMessage && <div aria-live="polite" className="auth-error" role="alert"><AlertCircle className="auth-error__icon" /><span>{errorMessage}</span></div>}
                <button aria-busy={submitting} className="auth-submit" disabled={submitting} type="submit">
                  {submitting ? 'Signing in...' : 'Sign in to dashboard'}
                  {submitting ? <Loader2 className="is-spinning" /> : <ArrowRight className="auth-submit__arrow" />}
                </button>
              </form>

              <div className="auth-access-note"><span className="auth-access-note__icon"><LockKeyhole aria-hidden="true" /></span><div><p>Need access to IslaSafe?</p><span>Contact your MDRRMO system administrator to request an account.</span></div></div>
            </>}
          </div>
          <p className="auth-fineprint"><CheckCircle2 /> Authorized IslaSafe personnel only</p>
        </div>
      </section>
      </div>
      <footer className="auth-footer">Developed by <span>Four Sisters and a Wedding</span></footer>
    </main>
  )
}
