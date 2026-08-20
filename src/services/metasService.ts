import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Meta, StatusMeta } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export interface FiltrosMetas {
  status?: StatusMeta | 'todas'
}

export const metasService = {
  async listar(filtros?: FiltrosMetas): Promise<{ data: Meta[] | null; error: Error | null }> {
    try {
      let query = rawClient.from('metas').select('*').order('created_at', { ascending: false })

      if (filtros?.status && filtros.status !== 'todas') {
        query = query.eq('status', filtros.status)
      }

      const { data, error } = await query

      if (error) throw error
      return { data: data as Meta[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async buscarPorId(id: string): Promise<{ data: Meta | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient.from('metas').select('*').eq('id', id).maybeSingle()

      if (error) throw error
      return { data: data as Meta | null, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(meta: {
    nome: string
    valor_objetivo: number
    valor_atual?: number
    data_limite?: string | null
    status?: StatusMeta | string | null
  }): Promise<{ data: Meta | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('metas')
        .insert({
          user_id: user.id,
          nome: meta.nome.trim(),
          valor_objetivo: Number(meta.valor_objetivo),
          valor_atual: Number(meta.valor_atual ?? 0),
          data_limite: meta.data_limite || null,
          status: meta.status || 'ativa',
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Meta, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async atualizar(
    id: string,
    updates: Partial<Omit<Meta, 'id' | 'user_id' | 'created_at'>>,
  ): Promise<{ data: Meta | null; error: Error | null }> {
    try {
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      if (updates.nome !== undefined) payload.nome = updates.nome.trim()
      if (updates.valor_objetivo !== undefined)
        payload.valor_objetivo = Number(updates.valor_objetivo)
      if (updates.valor_atual !== undefined) payload.valor_atual = Number(updates.valor_atual)
      if (updates.data_limite !== undefined) payload.data_limite = updates.data_limite || null

      const { data, error } = await rawClient
        .from('metas')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: data as Meta, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async excluir(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await rawClient.from('metas').delete().eq('id', id)
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },
}
