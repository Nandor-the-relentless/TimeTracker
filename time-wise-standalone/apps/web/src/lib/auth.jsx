import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext({ user: null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => sub?.subscription.unsubscribe()
  }, [])
  return <AuthCtx.Provider value={{ user }}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
