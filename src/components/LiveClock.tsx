import { useEffect, useState } from 'react'
import { philippineClock } from '../utils/philippineClock'

export function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  const clock = philippineClock(now)
  return <time className="topbar__clock" dateTime={now.toISOString()} title="Philippine Standard Time (UTC+8)"><span className="topbar__clock-time">{clock.time}</span><span>{clock.date} · PHT</span></time>
}
