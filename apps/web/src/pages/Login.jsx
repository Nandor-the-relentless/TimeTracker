// apps/web/src/pages/Login.jsx
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/api/base44Client"
import { useNavigate, useLocation } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const returnTo = params.get("from") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // If already signed in, bounce away from /login
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (mounted && user) navigate(returnTo, { replace: true })
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignIn(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Confirm session is usable
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sign-in succeeded but no active user session.")

      navigate(returnTo, { replace: true }) // use Router navigation (no hard refresh)
    } catch (err) {
      setError(err?.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-2xl text-white">🕒</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Treats Time</h1>
        <p className="text-center text-slate-600 mb-6">Please sign in to continue.</p>

        <form className="space-y-3" onSubmit={handleSignIn}>
          <input
            type="email"
            required
            placeholder="Email"
            autoComplete="email"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-blue-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            autoComplete="current-password"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-blue-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <div className="text-sm text-rose-600">{error}</div> : null}
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          {/* No "Create account" button */}
        </form>
      </div>
    </div>
  )
}
