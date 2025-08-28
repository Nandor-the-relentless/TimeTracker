// apps/web/src/pages/AuthCallback.jsx  (ensure redirect)
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../api/entities'

export default function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        navigate('/', { replace: true })
      } catch (e) {
        console.error('Auth callback error:', e)
        navigate('/login', { replace: true })
      }
    })()
  }, [navigate])
  return null
}
