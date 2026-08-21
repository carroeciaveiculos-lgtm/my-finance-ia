import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { DocumentoImportado, TipoDocumento, StatusDocumento } from '@/types'

const rawClient = supabase as unknown as SupabaseClient

export const documentosService = {
  async listar(): Promise<{ data: DocumentoImportado[] | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('documentos_importados')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as DocumentoImportado[], error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async buscarPorId(id: string): Promise<{ data: DocumentoImportado | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('documentos_importados')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return { data: data as DocumentoImportado | null, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async registrar(doc: {
    nome_arquivo: string
    tipo: TipoDocumento
    conta_id?: string | null
    status: StatusDocumento
    caminho_storage?: string | null
  }): Promise<{ data: DocumentoImportado | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await rawClient.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await rawClient
        .from('documentos_importados')
        .insert({
          user_id: user.id,
          nome_arquivo: doc.nome_arquivo,
          tipo: doc.tipo,
          conta_id: doc.conta_id || null,
          status: doc.status,
          caminho_storage: doc.caminho_storage || null,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as DocumentoImportado, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  async atualizarStatus(
    id: string,
    status: StatusDocumento,
  ): Promise<{ data: DocumentoImportado | null; error: Error | null }> {
    try {
      const { data, error } = await rawClient
        .from('documentos_importados')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: data as DocumentoImportado, error: null }
    } catch (err: unknown) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Conta quantos lançamentos estão vinculados a este documento
   */
  async contarLancamentos(id: string): Promise<number> {
    try {
      const { count, error } = await rawClient
        .from('lancamentos')
        .select('*', { count: 'exact', head: true })
        .eq('documento_id', id)

      if (error) throw error
      return count || 0
    } catch {
      return 0
    }
  },

  /**
   * Opção 1: Excluir apenas o registro do documento do histórico.
   * Os lançamentos existentes no banco são mantidos (documento_id fica NULL pelo ON DELETE SET NULL).
   */
  async excluirApenasRegistro(id: string): Promise<{ error: Error | null }> {
    try {
      // 1. Opcional: Garante explicitamente que documento_id seja setado para NULL caso necessário
      await rawClient.from('lancamentos').update({ documento_id: null }).eq('documento_id', id)

      // 2. Remove o documento
      const { error } = await rawClient.from('documentos_importados').delete().eq('id', id)
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },

  /**
   * Opção 2: Excluir documento E todos os lançamentos vinculados (WHERE documento_id = X)
   */
  async excluirDocumentoELancamentos(id: string): Promise<{ error: Error | null }> {
    try {
      // 1. Remove primeiro todos os lançamentos vinculados a este documento
      const { error: errLanc } = await rawClient.from('lancamentos').delete().eq('documento_id', id)

      if (errLanc) throw errLanc

      // 2. Remove o documento importado
      const { error: errDoc } = await rawClient.from('documentos_importados').delete().eq('id', id)

      if (errDoc) throw errDoc

      return { error: null }
    } catch (err: unknown) {
      return { error: err as Error }
    }
  },

  async excluir(id: string): Promise<{ error: Error | null }> {
    return this.excluirApenasRegistro(id)
  },
}
