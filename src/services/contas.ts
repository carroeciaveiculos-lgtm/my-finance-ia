import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Conta, TipoConta } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export const contasService = {
  async listar(): Promise<{ data: Conta[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('contas')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      return { data: data as Conta[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async buscarPorId(id: string): Promise<{ data: Conta | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient.from('contas').select('*').eq('id', id).maybeSingle()

      if (error) throw error
      return { data: data as Conta | null, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(conta: {
    nome: string
    tipo: TipoConta
    banco?: string | null
    saldo_inicial?: number
  }): Promise<{ data: Conta | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('contas')
        .insert({
          user_id: user.id,
          nome: conta.nome,
          tipo: conta.tipo,
          banco: conta.banco || null,
          saldo_inicial: conta.saldo_inicial ?? 0,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Conta, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async atualizar(
    id: string,
    updates: Partial<Omit<Conta, 'id' | 'user_id' | 'created_at'>>,
  ): Promise<{ data: Conta | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('contas')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: data as Conta, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async excluir(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await rawClient.from('contas').delete().eq('id', id)
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },
}
