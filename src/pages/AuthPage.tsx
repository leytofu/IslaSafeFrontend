import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { CinematicIntro } from '../components/CinematicIntro'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

type AuthMode = 'sign-in' | 'sign-up'

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<string | null>
  onRegister: (input: { name: string; email: string; password: string }) => Promise<string | null>
}

const authInputClassName = 'auth-input h-12 w-full rounded-xl border border-white/[0.12] bg-white/[0.045] pl-11 pr-3 text-sm text-slate-100 shadow-inner shadow-black/10 outline-none transition duration-200 placeholder:text-slate-600 hover:border-white/20 focus:border-indigo-400/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/10'

function AuthInput({ icon: Icon, label, ...inputProps }: InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-300">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input className={authInputClassName} {...inputProps} />
      </span>
    </label>
  )
}

function LoginPasswordField({ isSignIn, onChange, showPassword, onToggle, value }: { isSignIn: boolean; onChange: (value: string) => void; onToggle: () => void; showPassword: boolean; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-300">Password</span>
      <span className="relative block">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input autoComplete={isSignIn ? 'current-password' : 'new-password'} className={`${authInputClassName} pr-12`} name={isSignIn ? 'current-password' : 'new-password'} onChange={(event) => onChange(event.target.value)} placeholder="Enter your password" required type={showPassword ? 'text' : 'password'} value={value} />
        <button aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white/8 hover:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400" onClick={onToggle} type="button">
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  )
}

export function AuthPage({ onSignIn, onRegister }: AuthPageProps) {
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
    <main className="relative grid min-h-[100svh] overflow-x-hidden overflow-y-auto bg-[#050810] text-slate-100 lg:h-[100svh] lg:grid-cols-[minmax(0,1.1fr)_minmax(480px,0.9fr)] lg:overflow-hidden">
      <CinematicIntro />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_15%_5%,rgba(67,56,202,0.22),transparent_58%),radial-gradient(ellipse_60%_50%_at_95%_95%,rgba(14,116,144,0.16),transparent_62%)]" />

      <section className="relative hidden min-h-[100svh] flex-col justify-between px-10 pb-20 pt-9 lg:sticky lg:top-0 lg:flex lg:h-[100svh] xl:px-16">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-indigo-300/30 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-lg shadow-indigo-950/60"><Activity className="size-5 text-white" strokeWidth={2.4} /></span>
          <div><p className="font-display text-xl font-bold tracking-tight text-white">IslaSafe</p><p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-slate-500">MDRRMO OPERATIONS</p></div>
        </div>
        <div className="max-w-lg">
          <span className="mb-6 grid size-14 place-items-center rounded-2xl border border-indigo-300/20 bg-indigo-500/10 text-indigo-200"><ShieldCheck className="size-7" /></span>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">Coordinated response, when every second matters.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">A unified workspace for CPG emergency operations, live hazard awareness, evacuation coordination, and resident support.</p>
          <div className="mt-10 grid grid-cols-3 gap-3">{[['23', 'Barangays'], ['15', 'Centers'], ['24/7', 'Monitoring']].map(([value, label]) => <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4" key={label}><p className="font-display text-xl font-bold text-indigo-200">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</p></div>)}</div>
        </div>
        <p className="text-xs text-slate-600">Municipality of President Carlos P. Garcia · Bohol</p>
      </section>

      <section className="relative flex min-h-[100svh] items-center justify-center px-5 pb-20 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:h-[100svh] lg:overflow-y-auto">
        <div className="w-full max-w-[27rem]">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-xl border border-indigo-300/30 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500"><Activity className="size-5 text-white" /></span><span><span className="block font-display text-lg font-bold text-white">IslaSafe</span><span className="mt-0.5 block text-[9px] font-bold tracking-[0.18em] text-slate-500">MDRRMO OPERATIONS</span></span></div>
          <div className={`auth-panel p-5 sm:p-7 ${showPasswordRecovery ? '' : 'flex min-h-[620px] flex-col'}`}>
            {showPasswordRecovery ? <ForgotPasswordForm initialEmail={email} onBackToSignIn={() => setShowPasswordRecovery(false)} /> : <>
              <div className="mb-7">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" /> Secure portal</div>
                <h2 className="font-display text-[1.7rem] font-bold tracking-tight text-white">{isSignIn ? 'Welcome back' : 'Create your account'}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{isSignIn ? 'Sign in to continue to the operations dashboard.' : 'Register for an IslaSafe account. New accounts start with resident access.'}</p>
              </div>

              <div className="mb-7 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1.5" role="tablist">
                <button aria-selected={isSignIn} className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${isSignIn ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/50' : 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'}`} onClick={() => switchMode('sign-in')} role="tab" type="button">Sign in</button>
                <button aria-selected={!isSignIn} className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${!isSignIn ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/50' : 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'}`} onClick={() => switchMode('sign-up')} role="tab" type="button">Sign up</button>
              </div>

              <form autoComplete={isSignIn ? 'on' : 'off'} className="space-y-4" key={mode} onSubmit={handleSubmit}>
                {!isSignIn && <AuthInput autoComplete="off" icon={UserRound} label="Full name" onChange={(event) => setName(event.target.value)} placeholder="Juan Dela Cruz" required type="text" value={name} />}
                <AuthInput autoComplete={isSignIn ? 'username' : 'off'} icon={Mail} label="Email address" name={isSignIn ? 'username' : 'registration-email'} onChange={(event) => setEmail(event.target.value)} placeholder="name@cpg.gov.ph" required type="email" value={email} />
                <LoginPasswordField isSignIn={isSignIn} onChange={setPassword} onToggle={() => setShowPassword((current) => !current)} showPassword={showPassword} value={password} />
                {!isSignIn && <AuthInput autoComplete="new-password" icon={LockKeyhole} label="Confirm password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required type="password" value={confirmPassword} />}
                {isSignIn && <div className="flex items-center justify-between gap-3 pt-0.5"><label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400"><input className="size-3.5 rounded border-white/20 bg-white/5 accent-indigo-500" type="checkbox" /> Remember me</label><button className="text-xs font-semibold text-indigo-300 transition hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400" onClick={() => setShowPasswordRecovery(true)} type="button">Forgot password?</button></div>}
                {errorMessage && <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2.5 text-xs leading-5 text-rose-200" role="alert">{errorMessage}</div>}
                <button className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/45 bg-gradient-to-r from-indigo-500 to-indigo-500/90 text-sm font-semibold text-white shadow-lg shadow-indigo-950/50 transition hover:-translate-y-0.5 hover:from-indigo-400 hover:to-blue-500 hover:shadow-xl hover:shadow-indigo-950/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">
                  {submitting ? (isSignIn ? 'Signing in...' : 'Creating account...') : (isSignIn ? 'Sign in to dashboard' : 'Create account and continue')}
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                </button>
              </form>

              <div className="mt-auto border-t border-white/8 pt-5 text-center text-xs text-slate-500">{isSignIn ? <>New to IslaSafe? <button className="font-semibold text-indigo-300 transition hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400" onClick={() => switchMode('sign-up')} type="button">Create an account</button></> : <>Already registered? <button className="font-semibold text-indigo-300 transition hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400" onClick={() => switchMode('sign-in')} type="button">Sign in</button></>}</div>
            </>}
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-600"><CheckCircle2 className="size-3.5 text-emerald-500/80" /> Authorized IslaSafe personnel only</p>
        </div>
      </section>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-[#050810]/85 px-4 py-3 text-center text-[11px] text-slate-500 backdrop-blur-xl">Developed by <span className="font-semibold text-slate-300">Four Sisters and a Wedding</span></footer>
    </main>
  )
}
