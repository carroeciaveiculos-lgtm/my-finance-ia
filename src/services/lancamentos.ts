import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Lancamento, TipoLancamento } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export interface FiltrosLancamentos {
  dataInicio?: string
  dataFim?: string
  tipo?: TipoLancamento
  categoriaId?: string
  contaId?: string
}

export const lancamentosService = {
  async listar(
    filtros?: FiltrosLancamentos,
  ): Promise<{ data: Lancamento[] | null; error: Error | null }> {
    try {
      let query = rawClient
        .from('lancamentos')
        .select(`
          *,
          categoria:categorias!lancamentos_categoria_id_fkey(*),
          subcategoria:categorias!lancamentos_subcategoria_id_fkey(*),
          conta:contas!lancamentos_conta_id_fkey(*)
        `)
        .order('data', { ascending: false })

      if (filtros?.dataInicio) {
        query = query.gte('data', filtros.dataInicio)
      }
      if (filtros?.dataFim) {
        query = query.lte('data', filtros.dataFim)
      }
      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo)
      }
      if (filtros?.categoriaId) {
        query = query.eq('categoria_id', filtros.categoriaId)
      }
      if (filtros?.contaId) {
        query = query.eq('conta_id', filtros.contaId)
      }

      const { data, error } = await query

      if (error) throw error
      return { data: data as Lancamento[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async buscarPorId(id: string): Promise<{ data: Lancamento | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('lancamentos')
        .select(`
          *,
          categoria:categorias!lancamentos_categoria_id_fkey(*),
          subcategoria:categorias!lancamentos_subcategoria_id_fkey(*),
          conta:contas!lancamentos_conta_id_fkey(*)
        `)
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return { data: data as Lancamento | null, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(lancamento: {
    tipo: TipoLancamento
    valor: number
    data: string
    descricao?: string | null
    categoria_id?: string | null
    subcategoria_id?: string | null
    conta_id?: string | null
    documento_id?: string | null
  }): Promise<{ data: Lancamento | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('lancamentos')
        .insert({
          user_id: user.id,
          tipo: lancamento.tipo,
          valor: lancamento.valor,
          data: lancamento.data,
          descricao: lancamento.descricao || null,
          categoria_id: lancamento.categoria_id || null,
          subcategoria_id: lancamento.subcategoria_id || null,
          conta_id: lancamento.conta_id || null,
          documento_id: lancamento.documento_id || null,
        })
        .select(`
          *,
          categoria:categorias!lancamentos_categoria_id_fkey(*),
          subcategoria:categorias!lancamentos_subcategoria_id_fkey(*),
          conta:contas!lancamentos_conta_id_fkey(*)
        `)
        .single()

      if (error) throw error
      return { data: data as Lancamento, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async atualizar(
    id: string,
    updates: Partial<
      Omit<Lancamento, 'id' | 'user_id' | 'created_at' | 'categoria' | 'subcategoria' | 'conta'>
    >,
  ): Promise<{ data: Lancamento | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('lancamentos')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          categoria:categorias!lancamentos_categoria_id_fkey(*),
          subcategoria:categorias!lancamentos_subcategoria_id_fkey(*),
          conta:contas!lancamentos_conta_id_fkey(*)
        `)
        .single()

      if (error) throw error
      return { data: data as Lancamento, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async excluir(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await rawClient.from('lancamentos').delete().eq('id', id)
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },
}
