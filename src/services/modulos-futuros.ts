import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Meta, Divida, Investimento, Consorcio, Seguro } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export { metasService } from './metasService'

export const dividasService = {
  async listar(): Promise<{ data: Divida[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('dividas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Divida[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(divida: {
    nome: string
    valor_total: number
    valor_pago?: number
    taxa_juros?: number | null
    parcelas_total?: number | null
    parcelas_pagas?: number
    status?: string | null
  }): Promise<{ data: Divida | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('dividas')
        .insert({
          user_id: user.id,
          nome: divida.nome,
          valor_total: divida.valor_total,
          valor_pago: divida.valor_pago ?? 0,
          taxa_juros: divida.taxa_juros || null,
          parcelas_total: divida.parcelas_total || null,
          parcelas_pagas: divida.parcelas_pagas ?? 0,
          status: divida.status || 'ativa',
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Divida, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },
}

export const investimentosService = {
  async listar(): Promise<{ data: Investimento[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('investimentos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Investimento[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(investimento: {
    nome: string
    tipo?: string | null
    valor_aplicado: number
    valor_atual: number
    data_aplicacao?: string | null
  }): Promise<{ data: Investimento | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('investimentos')
        .insert({
          user_id: user.id,
          nome: investimento.nome,
          tipo: investimento.tipo || null,
          valor_aplicado: investimento.valor_aplicado,
          valor_atual: investimento.valor_atual,
          data_aplicacao: investimento.data_aplicacao || null,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Investimento, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },
}

export const consorciosService = {
  async listar(): Promise<{ data: Consorcio[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('consorcios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Consorcio[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(consorcio: {
    nome: string
    valor_credito: number
    valor_parcela: number
    parcelas_total: number
    parcelas_pagas?: number
    status?: 'ativo' | 'contemplado' | 'quitado'
  }): Promise<{ data: Consorcio | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('consorcios')
        .insert({
          user_id: user.id,
          nome: consorcio.nome,
          valor_credito: consorcio.valor_credito,
          valor_parcela: consorcio.valor_parcela,
          parcelas_total: consorcio.parcelas_total,
          parcelas_pagas: consorcio.parcelas_pagas ?? 0,
          status: consorcio.status || 'ativo',
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Consorcio, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },
}

export const segurosService = {
  async listar(): Promise<{ data: Seguro[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('seguros')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Seguro[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(seguro: {
    nome: string
    tipo?: string | null
    seguradora?: string | null
    valor_premio?: number | null
    data_inicio?: string | null
    data_vigencia?: string | null
    status?: string | null
  }): Promise<{ data: Seguro | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('seguros')
        .insert({
          user_id: user.id,
          nome: seguro.nome,
          tipo: seguro.tipo || null,
          seguradora: seguro.seguradora || null,
          valor_premio: seguro.valor_premio || null,
          data_inicio: seguro.data_inicio || null,
          data_vigencia: seguro.data_vigencia || null,
          status: seguro.status || 'ativo',
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Seguro, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },
}
