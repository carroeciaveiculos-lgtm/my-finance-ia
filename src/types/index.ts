export interface Profile {
  id: string
  email: string | null
  nome: string | null
  created_at: string | null
}

export interface UserSession {
  id: string
  email: string
  nome: string
}

// ==========================================
// Entidades Financeiras (Etapa 2)
// ==========================================

export type TipoConta = 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro' | 'outro'

export interface ContaStatus {
  id: string
  user_id: string | null
  nome: string
  cor: string
  created_at: string
  updated_at: string
}

export interface ContaGrupo {
  id: string
  user_id: string | null
  nome: string
  cor: string
  created_at: string
  updated_at: string
}

export interface Conta {
  id: string
  user_id: string
  nome: string
  tipo: TipoConta
  banco: string | null
  saldo_inicial: number
  numero_banco?: string | null
  agencia?: string | null
  agencia_digito?: string | null
  conta?: string | null
  conta_digito?: string | null
  bandeira?: string | null
  numero_cartao_final?: string | null
  validade?: string | null
  nome_impresso?: string | null
  status_id?: string | null
  grupo_id?: string | null
  status?: ContaStatus | null
  grupo?: ContaGrupo | null
  created_at: string
  updated_at: string
}

export type TipoLancamento = 'receita' | 'despesa' | 'transferencia'

export interface Categoria {
  id: string
  user_id: string | null
  nome: string
  tipo: 'receita' | 'despesa'
  categoria_pai_id: string | null
  created_at: string
  updated_at: string
  subcategorias?: Categoria[]
}

export interface Lancamento {
  id: string
  user_id: string
  tipo: TipoLancamento
  valor: number
  data: string
  descricao: string | null
  categoria_id: string | null
  subcategoria_id: string | null
  conta_id: string | null
  conta_destino_id?: string | null
  documento_id: string | null
  created_at: string
  updated_at: string
  categoria?: Categoria | null
  subcategoria?: Categoria | null
  conta?: Conta | null
  conta_destino?: Conta | null
}

export type TipoDocumento = 'pdf' | 'csv' | 'xls' | 'xlsx' | 'ofx'
export type StatusDocumento = 'importado' | 'processado' | 'erro' | 'nao_importado'

export interface DocumentoImportado {
  id: string
  user_id: string
  nome_arquivo: string
  tipo: TipoDocumento
  conta_id: string | null
  status: StatusDocumento
  caminho_storage: string | null
  total_lancamentos?: number
  total_valor?: number
  created_at: string
}

export interface LancamentoImportadoPrevia {
  id_temporario: string
  data: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria_id?: string | null
  subcategoria_id?: string | null
  categoria_sugerida?: string | null
  subcategoria_sugerida?: string | null
  sugestao_ia?: boolean
  duplicado_provavel?: boolean
  ignorar?: boolean
}

export interface ResultadoImportacao {
  documento: DocumentoImportado | null
  lancamentos: LancamentoImportadoPrevia[]
  total_extraidos: number
}

export type StatusConciliacao = 'correspondido' | 'nao_correspondido' | 'divergente' | 'revisao'

export interface Conciliacao {
  id: string
  user_id: string
  documento_id: string
  lancamento_id: string
  status: StatusConciliacao
  data_correspondencia: string | null
  created_at: string
}

export type StatusMeta = 'ativa' | 'concluida' | 'pausada'

export interface Meta {
  id: string
  user_id: string
  nome: string
  valor_objetivo: number
  valor_atual: number
  data_limite: string | null
  status: StatusMeta | string | null
  created_at: string
  updated_at: string
}

export interface Divida {
  id: string
  user_id: string
  nome: string
  valor_total: number
  valor_pago: number
  taxa_juros: number | null
  parcelas_total: number | null
  parcelas_pagas: number
  status: string | null
  created_at: string
  updated_at: string
}

export interface Investimento {
  id: string
  user_id: string
  nome: string
  tipo: string | null
  valor_aplicado: number
  valor_atual: number
  data_aplicacao: string | null
  created_at: string
  updated_at: string
}

export type StatusConsorcio = 'ativo' | 'contemplado' | 'quitado'

export interface Consorcio {
  id: string
  user_id: string
  nome: string
  valor_credito: number
  valor_parcela: number
  parcelas_total: number
  parcelas_pagas: number
  status: StatusConsorcio
  created_at: string
  updated_at: string
}

export interface Seguro {
  id: string
  user_id: string
  nome: string
  tipo: string | null
  seguradora: string | null
  valor_premio: number | null
  data_inicio: string | null
  data_vigencia: string | null
  status: string | null
  created_at: string
  updated_at: string
}
