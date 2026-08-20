import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Categoria, TipoLancamento } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export const categoriasService = {
  async listar(): Promise<{ data: Categoria[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      return { data: data as Categoria[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async listarArvore(): Promise<{ data: Categoria[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error

      const categorias = (data || []) as Categoria[]
      const pais = categorias.filter((c) => !c.categoria_pai_id)
      const arvore = pais.map((pai) => ({
        ...pai,
        subcategorias: categorias.filter((sub) => sub.categoria_pai_id === pai.id),
      }))

      return { data: arvore, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async criar(categoria: {
    nome: string
    tipo: TipoLancamento
    categoria_pai_id?: string | null
  }): Promise<{ data: Categoria | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('categorias')
        .insert({
          user_id: user.id,
          nome: categoria.nome,
          tipo: categoria.tipo,
          categoria_pai_id: categoria.categoria_pai_id || null,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Categoria, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async atualizar(
    id: string,
    updates: Partial<Omit<Categoria, 'id' | 'user_id' | 'created_at'>>,
  ): Promise<{ data: Categoria | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('categorias')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: data as Categoria, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async excluir(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await rawClient.from('categorias').delete().eq('id', id)
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },
}
