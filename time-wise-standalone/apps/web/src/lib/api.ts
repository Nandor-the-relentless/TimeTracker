import { supabase } from './supabase'

// Adapter layer to mirror existing app data calls. Expand as needed.
export const api = {
  async health() {
    const { data, error } = await supabase.from('health').select('*').limit(1)
    if (error) throw error
    return data
  }
}
