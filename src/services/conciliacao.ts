import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Conciliacao, StatusConciliacao } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export const conciliacaoService = {
  async listarPorDocumento(
    documentoId: string,
  ): Promise<{ data: Conciliacao[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('conciliacao')
        .select('*')
        .eq('documento_id', documentoId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Conciliacao[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(item: {
    documento_id: string
    lancamento_id: string
    status: StatusConciliacao
    data_correspondencia?: string | null
  }): Promise<{ data: Conciliacao | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('conciliacao')
        .insert({
          user_id: user.id,
          documento_id: item.documento_id,
          lancamento_id: item.lancamento_id,
          status: item.status,
          data_correspondencia: item.data_correspondencia || null,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Conciliacao, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async atualizarStatus(
    id: string,
    status: StatusConciliacao,
    dataCorrespondencia?: string | null,
  ): Promise<{ data: Conciliacao | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('conciliacao')
        .update({
          status,
          data_correspondencia: dataCorrespondencia || new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: data as Conciliacao, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async excluir(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await rawClient.from('conciliacao').delete().eq('id', id)
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },
}
