/**
 * useCountdown — tracks elapsed time since the bot started and
 * computes a human-readable string for the Dashboard stat card.
 */

import { useState, useEffect, useRef } from 'react'

export function useSessionTimer(botStatus) {
  const [elapsed, setElapsed] = useState('—')
  const startRef = useRef(null)

  useEffect(() => {
    if (botStatus === 'running' && !startRef.current) {
      startRef.current = Date.now()
    }
    if (botStatus === 'idle' || botStatus === 'expired') {
      startRef.current = null
      setElapsed('—')
      return
    }

    const iv = setInterval(() => {
      if (!startRef.current) return
      const totalSec = Math.floor((Date.now() - startRef.current) / 1000)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`)
    }, 1000)

    return () => clearInterval(iv)
  }, [botStatus])

  return elapsed
}
