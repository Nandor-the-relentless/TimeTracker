// apps/web/src/api/base44Client.js
// Full, copy-paste. Exports: named { supabase, base44 } and default base44.
import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !anon) throw new Error('Missing Supabase env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')

const supa = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

const origin = (import.meta.env.APP_PUBLIC_URL || window.location.origin).replace(/\/$/, '')
const redirectTo = `${origin}/auth/callback`

const LOGIN_PROVIDER = (import.meta.env.VITE_LOGIN_PROVIDER || 'password').toLowerCase()

function applyOrder(q, order) {
  if (!order) return q
  const desc = order.startsWith?.('-')
  const col  = desc ? order.slice(1) : order
  return q.order(col, { ascending: !desc })
}
function applyFilter(q, query = {}) {
  let b = q
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue
    if (Array.isArray(v)) b = b.in(k, v)
    else if (typeof v === 'object' && (v.gte || v.lte || v.gt || v.lt)) {
      if (v.gte !== undefined) b = b.gte(k, v.gte)
      if (v.lte !== undefined) b = b.lte(k, v.lte)
      if (v.gt  !== undefined) b = b.gt(k, v.gt)
      if (v.lt  !== undefined) b = b.lt(k, v.lt)
    } else if (typeof v === 'string' && v.includes('%')) b = b.like(k, v)
    else b = b.eq(k, v)
  }
  return b
}
function createEntity(table, defaultOrder = '-created_at') {
  return {
    async list(order = defaultOrder, limit = 100) {
      let q = supa.from(table).select('*'); q = applyOrder(q, order); if (limit) q = q.limit(limit)
      const { data, error } = await q; if (error) throw error; return data
    },
    async filter(query = {}, order = defaultOrder, limit = 100) {
      let q = supa.from(table).select('*'); q = applyFilter(q, query); q = applyOrder(q, order); if (limit) q = q.limit(limit)
      const { data, error } = await q; if (error) throw error; return data
    },
    async get(id) {
      const { data, error } = await supa.from(table).select('*').eq('id', id).single()
      if (error) throw error; return data
    },
    async create(payload) {
      const { data, error } = await supa.from(table).insert(payload).select().single()
      if (error) throw error; return data
    },
    async update(id, patch) {
      const { data, error } = await supa.from(table).update(patch).eq('id', id).select().single()
      if (error) throw error; return data
    },
    async delete(id) {
      const { error } = await supa.from(table).delete().eq('id', id)
      if (error) throw error
    }
  }
}

export const base44 = {
  auth: {
    async signInWithPassword({ email, password }) {
      return supa.auth.signInWithPassword({ email, password })
    },
    async signUpWithPassword({ email, password }) {
      return supa.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
    },
    async signOut() { return supa.auth.signOut() },
    async getUser() { const { data } = await supa.auth.getUser(); return data.user },
    onAuthStateChange(cb) {
      const { data } = supa.auth.onAuthStateChange((_e, session) => cb(session?.user ?? null))
      return () => data.subscription.unsubscribe()
    }
  },
  time: {
    async getActive(){ const { data, error } = await supa.rpc('get_active_entry'); if (error) throw error; return data },
    async start(){ const { data, error } = await supa.rpc('start_clock'); if (error) throw error; return data },
    async stop(note){ const { data, error } = await supa.rpc('stop_clock', { p_note: note ?? null }); if (error) throw error; return data },
  },
  db: { from: (t) => supa.from(t), rpc: (fn, args) => supa.rpc(fn, args) },
  storage: { from: (b) => supa.storage.from(b), avatars: () => supa.storage.from('avatars') },
  entities: {
    UserEntity: {
      async me() {
        const { data: { user }, error } = await supa.auth.getUser()
        if (error) throw error
        if (!user) return null
        const { data: profile } = await supa.from('profiles').select('*').eq('id', user.id).maybeSingle()
        return { user, profile: profile ?? {} }
      },
      async login() {
        if (LOGIN_PROVIDER === 'password') throw new Error('Password login is handled on /login form.')
        // If you later re-enable OAuth, handle here.
      },
      async logout(){ return supa.auth.signOut() }
    },
    TimeEntry:         createEntity('time_entries', '-created_at'),
    PTOPolicy:         createEntity('pto_policies', '-created_at'),
    PTOBalance:        createEntity('pto_balances', '-updated_at'),
    PTORequest:        createEntity('pto_requests', '-created_at'),
    Department:        createEntity('departments', 'name'),
    TeamMembership:    createEntity('team_memberships', '-created_at'),
    Settings:          createEntity('settings', null),
    AuditLog:          createEntity('audit_logs', '-created_at'),
    NotificationQueue: createEntity('notification_queue', '-created_at'),
    WeeklyHoursView:   createEntity('weekly_hours_view', 'week_start'),
    ReportPreset:      createEntity('report_presets', '-created_at'),
    ReportSchedule:    createEntity('report_schedules', '-created_at'),
  }
}

// named export (so `import { supabase }` works)
export const supabase = supa
// default export (so `import base44 from ...` works)
export default base44
