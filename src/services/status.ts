import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { ContaStatus } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export const statusService = {
  async listar(): Promise<{ data: ContaStatus[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('status')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      return { data: data as ContaStatus[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(status: {
    nome: string
    cor?: string
  }): Promise<{ data: ContaStatus | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('status')
        .insert({
          user_id: user.id,
          nome: status.nome.trim(),
          cor: status.cor || '#6B7280',
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as ContaStatus, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async atualizar(
    id: string,
    updates: { nome?: string; cor?: string },
  ): Promise<{ data: ContaStatus | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('status')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: data as ContaStatus, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async excluir(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await rawClient.from('status').delete().eq('id', id)
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },

  async contarContasUsando(id: string): Promise<number> {
    try {
      const { count, error } = await rawClient
        .from('contas')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', id)

      if (error) throw error
      return count || 0
    } catch {
      return 0
    }
  },
}
