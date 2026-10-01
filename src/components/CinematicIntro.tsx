import { useEffect, useState, type CSSProperties } from 'react'

const CURRENT_YEAR = new Date().getFullYear().toString()

let hasPlayedIntro = false

export function CinematicIntro() {
  const [complete, setComplete] = useState(() => hasPlayedIntro || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [showBrand, setShowBrand] = useState(false)
  const [morphing, setMorphing] = useState(false)
  const [yearSettled, setYearSettled] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (complete) return

    const timers = [
      window.setTimeout(() => setShowBrand(true), 180),
      window.setTimeout(() => setMorphing(true), 1500),
      window.setTimeout(() => setYearSettled(true), 2550),
      window.setTimeout(() => setLeaving(true), 3550),
      window.setTimeout(() => {
        hasPlayedIntro = true
        setComplete(true)
      }, 4070),
    ]

    return () => timers.forEach(window.clearTimeout)
  }, [complete])

  if (complete) return null

  return (
    <div aria-hidden="true" className={`cinematic-intro${leaving ? ' cinematic-intro-leaving' : ''}`}>
      <div className="cinematic-intro-blob cinematic-intro-blob-one" />
      <div className="cinematic-intro-blob cinematic-intro-blob-two" />
      <div className="cinematic-intro-inner">
        <div className="cinematic-intro-morph-stage">
          <p className={`cinematic-intro-brand${showBrand ? ' intro-brand-visible' : ''}${morphing ? ' intro-brand-morphing' : ''}`}>
            {'IslaSafe'.split('').map((letter, index) => <span key={`${letter}-${index}`} style={{ '--intro-letter-delay': `${index * 45}ms` } as CSSProperties}>{letter}</span>)}
          </p>
          <p className={`cinematic-intro-year${morphing ? ' intro-year-visible' : ''}`}>
            {CURRENT_YEAR.split('').map((digit, index) => <span className="intro-year-digit" key={`${digit}-${index}`} style={{ '--intro-digit-delay': `${index * 80}ms` } as CSSProperties}>{digit}</span>)}
          </p>
        </div>
        <div className="cinematic-intro-line"><span className={yearSettled ? 'intro-finished' : ''} /></div>
        <p className={`cinematic-intro-tagline${yearSettled ? ' intro-visible' : ''}`}>MDRRMO Admin Portal &middot; Carlos P. Garcia, Bohol</p>
      </div>
    </div>
  )
}
