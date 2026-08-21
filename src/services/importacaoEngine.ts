import { supabase } from '@/lib/supabase/client'
import type {
  Categoria,
  TipoLancamento,
  DocumentoImportado,
  LancamentoImportadoPrevia,
  ResultadoImportacao,
} from '@/types'
import { lancamentosService } from '@/services/lancamentos'
import { documentosService } from '@/services/documentos'
import { parseCSV, parseXLSX, parsePDF, type ParsedItem } from '@/services/importacaoParser'

export type GrupoPrevia = 'vai_lancar' | 'ja_existe' | 'precisa_revisao'

export interface ItemPreviaImportacao {
  item: ParsedItem
  grupo: GrupoPrevia
  motivo: string
  duplicataExataDe?: string
  duplicataParcialDe?: string
  categoria_id?: string | null
  subcategoria_id?: string | null
  categoriaSugeridaId?: string | null
  subcategoriaSugeridaId?: string | null
  categoriaNomeSugerida?: string | null
  sugestaoFonte?: 'historico_exato' | 'nenhuma'
  selecionadoParaSalvar?: boolean
}

/**
 * Normaliza strings para comparação estrita (lowercase, sem acentos, sem pontuação irrelevante).
 */
export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parser simples de OFX para extração de transações
 */
export function parseOFXSimples(content: string): ParsedItem[] {
  const items: ParsedItem[] = []
  const stmtTrnMatches = content.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) || []

  for (const trn of stmtTrnMatches) {
    const trntype = trn.match(/<TRNTYPE>([^<\r\n]+)/i)?.[1]?.trim()
    const dtposted = trn.match(/<DTPOSTED>([^<\r\n]+)/i)?.[1]?.trim()
    const trnamt = trn.match(/<TRNAMT>([^<\r\n]+)/i)?.[1]?.trim()
    const memo =
      trn.match(/<MEMO>([^<\r\n]+)/i)?.[1]?.trim() ||
      trn.match(/<NAME>([^<\r\n]+)/i)?.[1]?.trim() ||
      'Transação OFX'

    if (dtposted && trnamt) {
      const ano = dtposted.slice(0, 4)
      const mes = dtposted.slice(4, 6)
      const dia = dtposted.slice(6, 8)
      const dataIso = `${ano}-${mes}-${dia}`
      const valorNum = parseFloat(trnamt.replace(',', '.'))
      const isDebito = valorNum < 0 || trntype === 'DEBIT'

      items.push({
        data: dataIso,
        descricao: memo,
        valor: Math.abs(valorNum),
        tipo: isDebito ? 'despesa' : 'receita',
      })
    }
  }

  return items
}

/**
 * Classifica e auto-categoriza itens extraídos.
 */
export function classificarEAutoCategorizar({
  itensExtraidos,
  lancamentosExistentes,
  categorias,
}: {
  itensExtraidos: ParsedItem[]
  lancamentosExistentes: Array<{
    id: string
    data: string
    valor: number
    tipo: TipoLancamento
    descricao?: string | null
    categoria_id?: string | null
    subcategoria_id?: string | null
  }>
  categorias: Categoria[]
}): ItemPreviaImportacao[] {
  // Mapa de histórico por descrição idêntica
  const historicoPorDescricao: Record<
    string,
    { categoria_id?: string | null; subcategoria_id?: string | null }
  > = {}

  for (const lanc of lancamentosExistentes) {
    const descNorm = normalizarTexto(lanc.descricao)
    if (descNorm && lanc.subcategoria_id) {
      historicoPorDescricao[descNorm] = {
        categoria_id: lanc.categoria_id,
        subcategoria_id: lanc.subcategoria_id,
      }
    }
  }

  return itensExtraidos.map((item) => {
    const descNorm = normalizarTexto(item.descricao)
    const valorItem = Math.round(item.valor * 100) / 100

    // 1. Checa duplicidade exata
    const duplicataExata = lancamentosExistentes.find((existente) => {
      const valorExistente = Math.round(Number(existente.valor) * 100) / 100
      return (
        existente.data === item.data &&
        valorExistente === valorItem &&
        existente.tipo === item.tipo &&
        normalizarTexto(existente.descricao) === descNorm
      )
    })

    if (duplicataExata) {
      return {
        item,
        grupo: 'ja_existe',
        motivo: 'Lançamento idêntico já cadastrado nesta conta (mesma data, valor e descrição)',
        duplicataExataDe: duplicataExata.id,
        categoria_id: null,
        subcategoria_id: null,
        categoriaSugeridaId: null,
        subcategoriaSugeridaId: null,
        categoriaNomeSugerida: null,
        selecionadoParaSalvar: false,
      }
    }

    // 2. Checa correspondência parcial (mesma data e valor mas descrição diferente)
    const duplicataParcial = lancamentosExistentes.find((existente) => {
      const valorExistente = Math.round(Number(existente.valor) * 100) / 100
      return (
        existente.data === item.data && valorExistente === valorItem && existente.tipo === item.tipo
      )
    })

    if (duplicataParcial) {
      return {
        item,
        grupo: 'precisa_revisao',
        motivo: `Existe outro lançamento de mesmo valor e data ("${duplicataParcial.descricao || 'Sem descrição'}"). Verifique se é duplicata.`,
        duplicataParcialDe: duplicataParcial.id,
        categoria_id: null,
        subcategoria_id: null,
        categoriaSugeridaId: null,
        subcategoriaSugeridaId: null,
        categoriaNomeSugerida: null,
        selecionadoParaSalvar: true,
      }
    }

    // 3. Auto-categorização por histórico idêntico
    const sugestao = historicoPorDescricao[descNorm]
    if (sugestao && sugestao.subcategoria_id) {
      const catObj = categorias.find((c) => c.id === sugestao.categoria_id)
      const subObj = catObj?.subcategorias?.find((s) => s.id === sugestao.subcategoria_id)

      return {
        item,
        grupo: 'vai_lancar',
        motivo: 'Pronto para importação',
        categoria_id: sugestao.categoria_id || null,
        subcategoria_id: sugestao.subcategoria_id || null,
        categoriaSugeridaId: sugestao.categoria_id || null,
        subcategoriaSugeridaId: sugestao.subcategoria_id || null,
        categoriaNomeSugerida: subObj?.nome || catObj?.nome || 'Sugerida',
        sugestaoFonte: 'historico_exato',
        selecionadoParaSalvar: true,
      }
    }

    return {
      item,
      grupo: 'vai_lancar',
      motivo: 'Pronto para importação',
      categoria_id: null,
      subcategoria_id: null,
      categoriaSugeridaId: null,
      subcategoriaSugeridaId: null,
      categoriaNomeSugerida: null,
      selecionadoParaSalvar: true,
    }
  })
}

/**
 * Processa um documento de extrato ou arquivo e retorna os lançamentos classificados
 */
export async function processarDocumentoImportado(
  file: File,
  contaId: string,
): Promise<ResultadoImportacao> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  let itemsExtraidos: ParsedItem[] = []

  if (ext === 'csv') {
    const text = await file.text()
    const parsed = parseCSV(text)
    itemsExtraidos = parsed.itens || []
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const parsed = parseXLSX(buffer)
    itemsExtraidos = parsed.itens || []
  } else if (ext === 'pdf') {
    const buffer = await file.arrayBuffer()
    const parsed = await parsePDF(buffer)
    itemsExtraidos = parsed.itens || []
  } else if (ext === 'ofx') {
    const text = await file.text()
    itemsExtraidos = parseOFXSimples(text)
  }

  // 1. Cria o registro do documento importado no banco
  let tipoDoc: 'pdf' | 'csv' | 'xls' | 'xlsx' | 'ofx' = 'csv'
  if (['pdf', 'csv', 'xls', 'xlsx', 'ofx'].includes(ext)) {
    tipoDoc = ext as 'pdf' | 'csv' | 'xls' | 'xlsx' | 'ofx'
  }

  const { data: docCriado } = await documentosService.criar({
    nome_arquivo: file.name,
    tipo: tipoDoc,
    conta_id: contaId || null,
  })

  // 2. Busca lançamentos existentes para checar duplicados e categorias para auto-categorização
  const [resLancamentos, resCategorias] = await Promise.all([
    lancamentosService.listar(),
    supabase.from('categorias').select('*'),
  ])

  const lancamentosExistentes = (resLancamentos.data || []).map((l) => ({
    id: l.id,
    data: l.data,
    valor: Number(l.valor),
    tipo: l.tipo,
    descricao: l.descricao,
    categoria_id: l.categoria_id,
    subcategoria_id: l.subcategoria_id,
  }))

  const listaCategorias = (resCategorias.data as Categoria[]) || []

  // 3. Classifica e gera prévias
  const itensClassificados = classificarEAutoCategorizar({
    itensExtraidos: itemsExtraidos,
    lancamentosExistentes,
    categorias: listaCategorias,
  })

  const listaPrevia: LancamentoImportadoPrevia[] = itensClassificados.map((prev, idx) => {
    const isDuplicado = prev.grupo === 'ja_existe' || prev.grupo === 'precisa_revisao'
    return {
      id_temporario: `temp-${idx}-${Date.now()}`,
      data: prev.item.data,
      descricao: prev.item.descricao,
      valor: prev.item.valor,
      tipo: prev.item.tipo as 'receita' | 'despesa',
      categoria_id: prev.categoriaSugeridaId || null,
      subcategoria_id: prev.subcategoriaSugeridaId || null,
      sugestao_ia: prev.sugestaoFonte === 'historico_exato',
      duplicado_provavel: isDuplicado,
      ignorar: prev.grupo === 'ja_existe',
    }
  })

  return {
    documento: docCriado,
    lancamentos: listaPrevia,
    total_extraidos: listaPrevia.length,
  }
}
