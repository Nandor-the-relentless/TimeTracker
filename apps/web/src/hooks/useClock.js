import { useEffect, useState, useCallback } from 'react'
import { base44 } from '@/api/base44Client'

export function useClock() {
  const [active, setActive] = useState(null)  // the open entry or null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const data = await base44.time.getActive()
      setActive(data ?? null)
    } catch (e) {
      console.error(e); setError(e)
    }
  }, [])

  const start = useCallback(async () => {
    setLoading(true); setError(null)
    try { const data = await base44.time.start(); setActive(data) }
    catch (e) { console.error(e); setError(e) }
    finally { setLoading(false) }
  }, [])

  const stop = useCallback(async (note) => {
    setLoading(true); setError(null)
    try { await base44.time.stop(note); setActive(null) }
    catch (e) { console.error(e); setError(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { active, loading, error, start, stop, refresh }
}
