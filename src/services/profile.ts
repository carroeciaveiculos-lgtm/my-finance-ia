import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export const profileService = {
  async getProfile(userId: string): Promise<{ profile: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      return { profile: data as Profile | null, error: null }
    } catch (err: unknown) {
      return { profile: null, error: err as Error }
    }
  },

  async updateProfile(
    userId: string,
    updates: Partial<Profile>,
  ): Promise<{ profile: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { profile: data as Profile, error: null }
    } catch (err: unknown) {
      return { profile: null, error: err as Error }
    }
  },
}
