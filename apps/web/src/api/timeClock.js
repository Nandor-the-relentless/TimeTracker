// apps/web/src/api/timeClock.js
import { supabase } from '@/api/entities'

export async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user?.id || null
}

export async function getOpenEntry() {
  const uid = await getUserId()
  if (!uid) return null
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', uid)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data || null
}

export async function clockIn({ note = null, project_code = null } = {}) {
  const uid = await getUserId()
  if (!uid) throw new Error('Not authenticated')

  const existing = await getOpenEntry()
  if (existing) return existing

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: uid,
      start_time: now,
      end_time: null,
      note,
      project_code,
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function clockOut(entryId) {
  if (!entryId) throw new Error('No open entry to close')
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('time_entries')
    .update({ end_time: now })
    .eq('id', entryId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listWeekEntries(weekStartISO, weekEndISO) {
  const uid = await getUserId()
  if (!uid) return []
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', uid)
    .gte('start_time', weekStartISO)
    .lte('start_time', weekEndISO)
    .order('start_time', { ascending: true })
  if (error) throw error
  return data || []
}
