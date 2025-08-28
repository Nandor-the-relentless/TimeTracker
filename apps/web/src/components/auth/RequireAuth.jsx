/*
// apps/web/src/components/auth/RequireAuth.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '@/api/base44Client'

export default function RequireAuth({ children }) {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    let sub
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ?? null)
      setChecking(false)
      sub = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null)
      }).data.subscription
    })()
    return () => sub?.unsubscribe()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Render children for authed users; unauth is handled by public /login route in main.jsx
  return user ? children : null
}
*/

// apps/web/src/components/auth/RequireAuth.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '@/api/base44Client'
import { Navigate, useLocation } from 'react-router-dom'

export default function RequireAuth({ children }) {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(null)
  const location = useLocation()

  console.log('RequireAuth: Component mounted, checking:', checking, 'user:', user)

  useEffect(() => {
    let sub
    ;(async () => {
      console.log('RequireAuth: Starting auth check...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('RequireAuth: Auth result:', user)
      setUser(user ?? null)
      setChecking(false)
      console.log('RequireAuth: Set checking to false')
      
      sub = supabase.auth.onAuthStateChange((_e, session) => {
        console.log('RequireAuth: Auth state changed:', session?.user)
        setUser(session?.user ?? null)
      }).data.subscription
    })()
    return () => sub?.unsubscribe()
  }, [])

  if (checking) {
    console.log('RequireAuth: Still checking, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log('RequireAuth: No user, redirecting to login')
    const from = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?from=${from}`} replace />
  }
  
  console.log('RequireAuth: User found, rendering children')
  return children
}