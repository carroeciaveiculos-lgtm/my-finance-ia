import type { TipoLancamento } from '@/types'
import * as XLSX from 'xlsx'

export interface ParsedItem {
  data: string // YYYY-MM-DD
  descricao: string
  valor: number // positivo (float > 0)
  tipo: TipoLancamento
  rawRow?: Record<string, unknown> | string[]
}

export interface ParseResult {
  sucesso: boolean
  itens: ParsedItem[]
  erro?: string
  totalLinhasLidas?: number
}

export const COLUNAS_ESPERADAS_AJUDA = {
  data: [
    'Data',
    'Dt.',
    'Dt',
    'Data do Movimento',
    'Data Lançamento',
    'Data Pagamento',
    'Data Compra',
    'Data Movimento',
    'Data de Lançamento',
    'Data do Lançamento',
    'Date',
    'Dia',
  ],
  valor: [
    'Valor',
    'Valor (R$)',
    'Valor R$',
    'Valor (R)',
    'Crédito/Débito',
    'Débito',
    'Crédito',
    'Saldo',
    'Valor da Operação',
    'Valor Líquido',
    'Entrada',
    'Saída',
    'Amount',
    'Quantia',
  ],
  descricao: [
    'Descrição',
    'Descricao',
    'Histórico',
    'Histórico do Lançamento',
    'Lançamento',
    'Texto',
    'Memorando',
    'Detalhes',
    'Complemento',
    'Estabelecimento',
    'Título',
    'Memo',
  ],
}

/**
 * Normaliza data de múltiplos formatos (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY, timestamp ou número de série do Excel) para YYYY-MM-DD
 */
export function normalizarData(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null

  // Se já for Date
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10)
  }

  // Se for número de série do Excel (ex: 45367)
  if (typeof val === 'number') {
    // Excel base date ~ 1899-12-30
    const date = new Date(Math.round((val - 25569) * 86400 * 1000))
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  }

  const str = String(val).trim()
  if (!str) return null

  // Formato ISO: YYYY-MM-DD ou YYYY/MM/DD ou YYYY.MM.DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = isoMatch[2].padStart(2, '0')
    const d = isoMatch[3].padStart(2, '0')
    const monthNum = parseInt(m, 10)
    const dayNum = parseInt(d, 10)
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${y}-${m}-${d}`
    }
  }

  // Formato Brasileiro: DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const brMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  if (brMatch) {
    const d = brMatch[1].padStart(2, '0')
    const m = brMatch[2].padStart(2, '0')
    let y = brMatch[3]
    if (y.length === 2) {
      const currentYear = new Date().getFullYear()
      const prefix = String(currentYear).slice(0, 2)
      y = `${prefix}${y}`
    }
    const monthNum = parseInt(m, 10)
    const dayNum = parseInt(d, 10)
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${y}-${m}-${d}`
    }
  }

  return null
}

/**
 * Converte valor em formato string/número brasileiro ou internacional para number e tipo
 * Ex: "R$ 1.250,50", "-150.00", "(50,00)", "+ 300,00", "1250.50 D", "1250.50 C"
 */
export function normalizarValor(
  val: unknown,
  tipoForcado?: string,
): { valor: number; tipo: TipoLancamento } | null {
  if (val === null || val === undefined || val === '') return null

  if (typeof val === 'number') {
    if (isNaN(val) || val === 0) return null
    if (val < 0) {
      return { valor: Math.abs(Number(val.toFixed(2))), tipo: 'despesa' }
    }
    return {
      valor: Math.abs(Number(val.toFixed(2))),
      tipo:
        tipoForcado?.toLowerCase().includes('desp') ||
        tipoForcado?.toLowerCase() === 'd' ||
        tipoForcado?.toLowerCase() === 'debito' ||
        tipoForcado?.toLowerCase() === 'débito' ||
        tipoForcado?.toLowerCase() === 'saida' ||
        tipoForcado?.toLowerCase() === 'saída'
          ? 'despesa'
          : 'receita',
    }
  }

  let str = String(val).trim()
  if (!str) return null

  let isNegative = false

  // Checar parênteses financeiros: (120,00)
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true
    str = str.slice(1, -1).trim()
  }

  // Checar sufixo ou prefixo D/C
  if (/\b(D|DEB|DEBITO|DÉBITO)\b/i.test(str)) {
    isNegative = true
    str = str.replace(/\b(D|DEB|DEBITO|DÉBITO)\b/gi, '').trim()
  } else if (/\b(C|CRED|CREDITO|CRÉDITO)\b/i.test(str)) {
    str = str.replace(/\b(C|CRED|CREDITO|CRÉDITO)\b/gi, '').trim()
  }

  if (str.startsWith('-')) {
    isNegative = true
    str = str.replace(/^-/, '').trim()
  } else if (str.startsWith('+')) {
    str = str.replace(/^\+/, '').trim()
  }

  // Limpar moeda e espaços
  str = str.replace(/[R$\s]/g, '')

  // Se tiver ponto e vírgula: "1.250,50" -> "1250.50"
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.')
  } else if (str.includes(',')) {
    // Só vírgula: "1250,50" -> "1250.50"
    str = str.replace(',', '.')
  }

  const num = parseFloat(str)
  if (isNaN(num) || num === 0) return null

  const valorAbs = Math.abs(Number(num.toFixed(2)))

  if (tipoForcado) {
    const tLower = tipoForcado.toLowerCase().trim()
    if (
      tLower.startsWith('desp') ||
      tLower === 'd' ||
      tLower === 'debito' ||
      tLower === 'débito' ||
      tLower === 'saida' ||
      tLower === 'saída'
    ) {
      return { valor: valorAbs, tipo: 'despesa' }
    }
    if (
      tLower.startsWith('rec') ||
      tLower === 'c' ||
      tLower === 'credito' ||
      tLower === 'crédito' ||
      tLower === 'entrada'
    ) {
      return { valor: valorAbs, tipo: 'receita' }
    }
  }

  return {
    valor: valorAbs,
    tipo: isNegative ? 'despesa' : 'receita',
  }
}

/**
 * Normaliza strings de cabeçalho para comparação flexível
 */
export function normalizarHeader(texto: string | null | undefined): string {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Verifica se um texto de cabeçalho corresponde a Data
 */
function isDataHeader(norm: string): boolean {
  if (!norm) return false
  const keywords = [
    'data',
    'dt',
    'datadomovimento',
    'datalancamento',
    'datapagamento',
    'datacompra',
    'datamovimento',
    'datadelancamento',
    'datadolancamento',
    'date',
    'dia',
  ]
  return keywords.some((k) => norm === k || norm.startsWith('data') || norm.includes('data'))
}

/**
 * Verifica se um texto de cabeçalho corresponde a Descrição
 */
function isDescricaoHeader(norm: string): boolean {
  if (!norm) return false
  const keywords = [
    'descricao',
    'desc',
    'historico',
    'historicodolancamento',
    'lancamento',
    'texto',
    'memorando',
    'detalhes',
    'detalhe',
    'complemento',
    'memo',
    'estabelecimento',
    'titulo',
    'nome',
    'narrativa',
    'motivo',
  ]
  return keywords.some((k) => norm === k || norm.includes('historico') || norm.includes('desc'))
}

/**
 * Verifica se um texto de cabeçalho corresponde a Valor único
 */
function isValorHeader(norm: string): boolean {
  if (!norm) return false
  const keywords = [
    'valor',
    'valorr',
    'valorbrl',
    'creditodebito',
    'debitocredito',
    'valordaoperacao',
    'valorliquido',
    'amount',
    'quantia',
    'vlr',
    'saldo',
    'total',
  ]
  return keywords.some((k) => norm === k || (norm.startsWith('valor') && !norm.includes('saldo')))
}

/**
 * Verifica se um texto de cabeçalho é de Débito/Saída
 */
function isDebitoHeader(norm: string): boolean {
  if (!norm) return false
  const keywords = [
    'debito',
    'debitos',
    'saida',
    'saidas',
    'despesa',
    'despesas',
    'deb',
    'pagamento',
  ]
  return keywords.some((k) => norm === k || norm.startsWith('debito') || norm.startsWith('saida'))
}

/**
 * Verifica se um texto de cabeçalho é de Crédito/Entrada
 */
function isCreditoHeader(norm: string): boolean {
  if (!norm) return false
  const keywords = ['credito', 'creditos', 'entrada', 'entradas', 'receita', 'receitas', 'cred']
  return keywords.some(
    (k) => norm === k || norm.startsWith('credito') || norm.startsWith('entrada'),
  )
}

/**
 * Divide linha respeitando delimitador e aspas
 */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''))
  return result
}

/**
 * Detecta o melhor delimitador para um texto CSV
 */
export function detectarDelimitador(linhas: string[]): string {
  const delimiters = [';', ',', '\t', '|']
  const score: Record<string, number> = { ';': 0, ',': 0, '\t': 0, '|': 0 }

  const linhasParaTestar = linhas.slice(0, Math.min(linhas.length, 10))

  for (const delim of delimiters) {
    let colCounts: number[] = []
    for (const linha of linhasParaTestar) {
      const cols = splitCsvLine(linha, delim)
      if (cols.length > 1) {
        colCounts.push(cols.length)
      }
    }
    if (colCounts.length > 0) {
      // Se a contagem de colunas for consistente entre as linhas, ganha mais pontos
      const firstCount = colCounts[0]
      const consistent = colCounts.filter((c) => c === firstCount).length
      score[delim] = colCounts.reduce((a, b) => a + b, 0) + consistent * 5
    }
  }

  let melhorDelim = ';'
  let maiorScore = -1

  for (const delim of delimiters) {
    if (score[delim] > maiorScore) {
      maiorScore = score[delim]
      melhorDelim = delim
    }
  }

  return maiorScore > 0 ? melhorDelim : ';'
}

/**
 * Gera mensagem de erro amigável e detalhada
 */
export function gerarMensagemErroLayout(): string {
  return (
    'Não foi possível reconhecer o layout deste extrato bancário. ' +
    'Certifique-se de que o arquivo contenha colunas de Data (ex.: "Data", "Dt.", "Data do Movimento") ' +
    'e Valor (ex.: "Valor", "Valor (R$)" ou colunas separadas de "Débito" e "Crédito"). ' +
    'Sugerimos exportar o extrato em formato XLSX ou CSV direto pelo Internet Banking/app do seu banco, ' +
    'ou se preferir, registrar o lançamento manualmente.'
  )
}

interface ColunasMapeadas {
  dataIdx: number
  descIdx: number
  valorIdx: number
  debitoIdx: number
  creditoIdx: number
  tipoIdx: number
}

/**
 * Tenta mapear colunas a partir de um array de strings de cabeçalho
 */
function mapearColunas(headers: string[]): ColunasMapeadas {
  const normHeaders = headers.map(normalizarHeader)

  let dataIdx = -1
  let descIdx = -1
  let valorIdx = -1
  let debitoIdx = -1
  let creditoIdx = -1
  let tipoIdx = -1

  for (let i = 0; i < normHeaders.length; i++) {
    const h = normHeaders[i]
    if (!h) continue

    if (dataIdx === -1 && isDataHeader(h)) {
      dataIdx = i
    } else if (debitoIdx === -1 && isDebitoHeader(h)) {
      debitoIdx = i
    } else if (creditoIdx === -1 && isCreditoHeader(h)) {
      creditoIdx = i
    } else if (valorIdx === -1 && isValorHeader(h)) {
      valorIdx = i
    } else if (descIdx === -1 && isDescricaoHeader(h)) {
      descIdx = i
    } else if (
      tipoIdx === -1 &&
      (h === 'tipo' || h === 'natureza' || h === 'dc' || h === 'type' || h === 'tipolancamento')
    ) {
      tipoIdx = i
    }
  }

  return { dataIdx, descIdx, valorIdx, debitoIdx, creditoIdx, tipoIdx }
}

/**
 * Extrai item estruturado de uma linha mapeada
 */
function extrairItemDeLinha(row: (string | unknown)[], cols: ColunasMapeadas): ParsedItem | null {
  const { dataIdx, descIdx, valorIdx, debitoIdx, creditoIdx, tipoIdx } = cols

  if (dataIdx === -1) return null

  const rawData = row[dataIdx]
  const dataNorm = normalizarData(rawData)
  if (!dataNorm) return null

  const rawDesc = descIdx !== -1 && row[descIdx] ? String(row[descIdx]) : 'Lançamento sem descrição'
  const descNorm = rawDesc.trim() || 'Lançamento sem descrição'

  // Caso 1: Colunas separadas de Débito e Crédito
  if (debitoIdx !== -1 || creditoIdx !== -1) {
    const rawDeb = debitoIdx !== -1 ? row[debitoIdx] : null
    const rawCred = creditoIdx !== -1 ? row[creditoIdx] : null

    const debNorm = normalizarValor(rawDeb, 'debito')
    const credNorm = normalizarValor(rawCred, 'credito')

    if (debNorm && debNorm.valor > 0) {
      return {
        data: dataNorm,
        descricao: descNorm,
        valor: debNorm.valor,
        tipo: 'despesa',
        rawRow: row as Record<string, unknown> | string[],
      }
    }

    if (credNorm && credNorm.valor > 0) {
      return {
        data: dataNorm,
        descricao: descNorm,
        valor: credNorm.valor,
        tipo: 'receita',
        rawRow: row as Record<string, unknown> | string[],
      }
    }
  }

  // Caso 2: Coluna única de Valor
  if (valorIdx !== -1) {
    const rawVal = row[valorIdx]
    const rawTipo = tipoIdx !== -1 ? String(row[tipoIdx]) : undefined
    const valNorm = normalizarValor(rawVal, rawTipo)

    if (valNorm && valNorm.valor > 0) {
      return {
        data: dataNorm,
        descricao: descNorm,
        valor: valNorm.valor,
        tipo: valNorm.tipo,
        rawRow: row as Record<string, unknown> | string[],
      }
    }
  }

  return null
}

/**
 * Parser inteligente de CSV: detecta delimitadores, linhas de cabeçalho extras,
 * colunas separadas débito/crédito e fallback posicional.
 */
export function parseCSV(content: string): ParseResult {
  if (!content || typeof content !== 'string') {
    return {
      sucesso: false,
      itens: [],
      erro: 'Arquivo CSV vazio ou em formato inválido.',
    }
  }

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return {
      sucesso: false,
      itens: [],
      erro: 'Arquivo CSV vazio ou sem linhas de dados suficientes.',
    }
  }

  const delimiter = detectarDelimitador(lines)

  // 1. Encontrar a linha de cabeçalho (pode haver títulos, saldo anterior ou metadados antes)
  let headerLineIdx = -1
  let mapeamento: ColunasMapeadas = {
    dataIdx: -1,
    descIdx: -1,
    valorIdx: -1,
    debitoIdx: -1,
    creditoIdx: -1,
    tipoIdx: -1,
  }

  const maxHeaderSearch = Math.min(lines.length, 15)
  for (let i = 0; i < maxHeaderSearch; i++) {
    const row = splitCsvLine(lines[i], delimiter)
    const m = mapearColunas(row)
    const hasData = m.dataIdx !== -1
    const hasValor = m.valorIdx !== -1 || m.debitoIdx !== -1 || m.creditoIdx !== -1

    if (hasData && hasValor) {
      headerLineIdx = i
      mapeamento = m
      break
    }
  }

  // Se não achou cabeçalho nomeado, tenta deduzir por padrão/posição analisando as primeiras linhas de dados
  if (headerLineIdx === -1) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const row = splitCsvLine(lines[i], delimiter)
      let foundData = -1
      let foundValor = -1
      let foundDesc = -1

      for (let c = 0; c < row.length; c++) {
        if (foundData === -1 && normalizarData(row[c])) {
          foundData = c
        } else if (foundValor === -1 && normalizarValor(row[c])) {
          foundValor = c
        }
      }

      if (foundData !== -1 && foundValor !== -1) {
        for (let c = 0; c < row.length; c++) {
          if (c !== foundData && c !== foundValor && row[c] && isNaN(Number(row[c]))) {
            foundDesc = c
            break
          }
        }
        headerLineIdx =
          i > 0 && isNaN(Number(splitCsvLine(lines[0], delimiter)[foundValor])) ? 0 : -1
        mapeamento = {
          dataIdx: foundData,
          descIdx: foundDesc,
          valorIdx: foundValor,
          debitoIdx: -1,
          creditoIdx: -1,
          tipoIdx: -1,
        }
        break
      }
    }
  }

  const hasDataCol = mapeamento.dataIdx !== -1
  const hasValorCol =
    mapeamento.valorIdx !== -1 ||
    (mapeamento.debitoIdx !== -1 && mapeamento.creditoIdx !== -1) ||
    mapeamento.debitoIdx !== -1 ||
    mapeamento.creditoIdx !== -1

  if (!hasDataCol || !hasValorCol) {
    return {
      sucesso: false,
      itens: [],
      erro: gerarMensagemErroLayout(),
    }
  }

  const itens: ParsedItem[] = []
  const startIdx = headerLineIdx >= 0 ? headerLineIdx + 1 : 0

  for (let i = startIdx; i < lines.length; i++) {
    const row = splitCsvLine(lines[i], delimiter)
    if (row.length === 0 || (row.length === 1 && !row[0])) continue

    // Ignora linhas de totalização ou rodapés típicos
    const rowStr = row.join(' ').toLowerCase()
    if (
      rowStr.includes('saldo final') ||
      rowStr.includes('total consolidado') ||
      rowStr.includes('total geral')
    ) {
      continue
    }

    const item = extrairItemDeLinha(row, mapeamento)
    if (item) {
      itens.push(item)
    }
  }

  if (itens.length === 0) {
    return {
      sucesso: false,
      itens: [],
      erro: 'Nenhuma transação válida foi encontrada no CSV. ' + gerarMensagemErroLayout(),
    }
  }

  return {
    sucesso: true,
    itens,
    totalLinhasLidas: lines.length - startIdx,
  }
}

/**
 * Parser de planilhas XLS/XLSX usando SheetJS com suporte a linhas de cabeçalho extras e colunas flexíveis
 */
export function parseXLSX(dataBuffer: ArrayBuffer | Uint8Array): ParseResult {
  try {
    const workbook = XLSX.read(dataBuffer, { type: 'array', cellDates: true })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return { sucesso: false, itens: [], erro: 'A planilha está vazia.' }
    }

    const worksheet = workbook.Sheets[firstSheetName]
    // Converte para matriz de linhas (AOA: Array of Arrays) para permitir detectar onde está o cabeçalho
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    })

    if (!matrix || matrix.length === 0) {
      return { sucesso: false, itens: [], erro: 'Nenhuma linha de dados encontrada na planilha.' }
    }

    // Procura a linha de cabeçalho
    let headerLineIdx = -1
    let mapeamento: ColunasMapeadas = {
      dataIdx: -1,
      descIdx: -1,
      valorIdx: -1,
      debitoIdx: -1,
      creditoIdx: -1,
      tipoIdx: -1,
    }

    for (let i = 0; i < Math.min(matrix.length, 15); i++) {
      const row = matrix[i] as unknown[]
      if (!Array.isArray(row)) continue

      const stringRow = row.map((c) => String(c ?? ''))
      const m = mapearColunas(stringRow)
      const hasData = m.dataIdx !== -1
      const hasValor = m.valorIdx !== -1 || m.debitoIdx !== -1 || m.creditoIdx !== -1

      if (hasData && hasValor) {
        headerLineIdx = i
        mapeamento = m
        break
      }
    }

    // Fallback se não encontrou cabeçalho nomeado
    if (headerLineIdx === -1) {
      for (let i = 0; i < Math.min(matrix.length, 5); i++) {
        const row = matrix[i] as unknown[]
        if (!Array.isArray(row)) continue

        let foundData = -1
        let foundValor = -1
        let foundDesc = -1

        for (let c = 0; c < row.length; c++) {
          if (foundData === -1 && normalizarData(row[c])) {
            foundData = c
          } else if (foundValor === -1 && normalizarValor(row[c])) {
            foundValor = c
          }
        }

        if (foundData !== -1 && foundValor !== -1) {
          for (let c = 0; c < row.length; c++) {
            if (c !== foundData && c !== foundValor && row[c] && isNaN(Number(row[c]))) {
              foundDesc = c
              break
            }
          }
          headerLineIdx = i > 0 ? 0 : -1
          mapeamento = {
            dataIdx: foundData,
            descIdx: foundDesc,
            valorIdx: foundValor,
            debitoIdx: -1,
            creditoIdx: -1,
            tipoIdx: -1,
          }
          break
        }
      }
    }

    const hasDataCol = mapeamento.dataIdx !== -1
    const hasValorCol =
      mapeamento.valorIdx !== -1 ||
      (mapeamento.debitoIdx !== -1 && mapeamento.creditoIdx !== -1) ||
      mapeamento.debitoIdx !== -1 ||
      mapeamento.creditoIdx !== -1

    if (!hasDataCol || !hasValorCol) {
      return {
        sucesso: false,
        itens: [],
        erro: gerarMensagemErroLayout(),
      }
    }

    const itens: ParsedItem[] = []
    const startIdx = headerLineIdx >= 0 ? headerLineIdx + 1 : 0

    for (let i = startIdx; i < matrix.length; i++) {
      const row = matrix[i] as unknown[]
      if (!Array.isArray(row) || row.length === 0) continue

      const item = extrairItemDeLinha(row, mapeamento)
      if (item) {
        itens.push(item)
      }
    }

    if (itens.length === 0) {
      return {
        sucesso: false,
        itens: [],
        erro:
          'Nenhuma transação válida encontrada nas linhas da planilha. ' +
          gerarMensagemErroLayout(),
      }
    }

    return {
      sucesso: true,
      itens,
      totalLinhasLidas: matrix.length - startIdx,
    }
  } catch (err: unknown) {
    return {
      sucesso: false,
      itens: [],
      erro: `Erro ao processar planilha: ${(err as Error).message || 'formato inválido'}. ${gerarMensagemErroLayout()}`,
    }
  }
}

/**
 * Parser de PDF com extração de texto via pdfjs-dist.
 * Se o PDF não tiver estrutura reconhecida com 100% de precisão, rejeita com erro explicativo e NUNCA gera dados falsos.
 */
export async function parsePDF(dataBuffer: ArrayBuffer | Uint8Array): Promise<ParseResult> {
  try {
    const pdfjs = await import('pdfjs-dist')

    // Configura o worker se necessário no browser
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.10.38'}/pdf.worker.min.mjs`
    }

    const loadingTask = pdfjs.getDocument({
      data: dataBuffer instanceof Uint8Array ? dataBuffer : new Uint8Array(dataBuffer),
      useSystemFonts: true,
    })

    const pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages
    let fullText = ''

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const content = await page.getTextContent()
      const strings: string[] = []
      for (const item of content.items) {
        if (
          typeof item === 'object' &&
          item !== null &&
          'str' in item &&
          typeof (item as { str: unknown }).str === 'string'
        ) {
          strings.push((item as { str: string }).str)
        }
      }
      fullText += strings.join(' ') + '\n'
    }

    if (!fullText.trim()) {
      return {
        sucesso: false,
        itens: [],
        erro:
          'Não foi possível ler este PDF. O documento parece estar vazio ou escaneado como imagem. ' +
          'Sugerimos exportar o extrato como CSV ou XLSX pelo aplicativo ou Internet Banking do seu banco, ou lançar manualmente.',
      }
    }

    // Tenta identificar linhas estruturadas de extrato bancário
    // Padrão comum: DD/MM/AAAA [Descrição...] R$ [-]X.XXX,XX ou [-]X.XXX,XX
    const regexLinhaTransacao =
      /(\d{2}[/-]\d{2}(?:[/-]\d{2,4})?)\s+([A-Za-z0-9À-ÿ\s.,*#/_\\-]+?)\s+([+-]?\s*(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*,\d{2}(?:\s*[DCdc])?)/g

    const itens: ParsedItem[] = []
    let match: RegExpExecArray | null

    while ((match = regexLinhaTransacao.exec(fullText)) !== null) {
      const rawData = match[1]
      const rawDesc = match[2].trim()
      const rawValor = match[3].trim()

      const dataNorm = normalizarData(rawData)
      const valorNorm = normalizarValor(rawValor)

      if (dataNorm && valorNorm && rawDesc.length > 2) {
        itens.push({
          data: dataNorm,
          descricao: rawDesc,
          valor: valorNorm.valor,
          tipo: valorNorm.tipo,
        })
      }
    }

    // Regra Ética: Se não encontrou nenhuma transação com alta precisão, NUNCA inventa ou chuta
    if (itens.length === 0) {
      return {
        sucesso: false,
        itens: [],
        erro:
          'Não foi possível identificar lançamentos estruturados neste PDF com precisão. ' +
          'Para evitar dados inconsistentes, sugerimos exportar o extrato em formato XLSX ou CSV pelo app do seu banco, ou registrar manualmente.',
      }
    }

    return {
      sucesso: true,
      itens,
      totalLinhasLidas: itens.length,
    }
  } catch (err: unknown) {
    return {
      sucesso: false,
      itens: [],
      erro:
        `Não foi possível ler este arquivo PDF (${(err as Error).message || 'formato não suportado'}). ` +
        'Sugerimos exportar o extrato como CSV ou XLSX pelo app do seu banco ou registrar os lançamentos manualmente.',
    }
  }
}
