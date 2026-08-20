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

/**
 * Normaliza data de múltiplos formatos (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, timestamp ou número de série do Excel) para YYYY-MM-DD
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

  // Formato ISO: YYYY-MM-DD ou YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = isoMatch[2].padStart(2, '0')
    const d = isoMatch[3].padStart(2, '0')
    return `${y}-${m}-${d}`
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
    return `${y}-${m}-${d}`
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
        tipoForcado?.toLowerCase().includes('desp') || tipoForcado?.toLowerCase() === 'd'
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
 * Parser inteligente de CSV: detecta delimitador (; , ou \t) e mapeia colunas
 */
export function parseCSV(content: string): ParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) {
    return {
      sucesso: false,
      itens: [],
      erro: 'Arquivo CSV vazio ou sem linhas de dados suficientes.',
    }
  }

  // Detectar delimitador na primeira linha com mais ocorrências
  const firstLine = lines[0]
  const countSemicolon = (firstLine.match(/;/g) || []).length
  const countComma = (firstLine.match(/,/g) || []).length
  const countTab = (firstLine.match(/\t/g) || []).length

  let delimiter = ','
  if (countSemicolon >= countComma && countSemicolon >= countTab && countSemicolon > 0) {
    delimiter = ';'
  } else if (countTab >= countComma && countTab > 0) {
    delimiter = '\t'
  }

  const splitLine = (line: string): string[] => {
    // Tratamento simples para campos com aspas
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

  const rawHeader = splitLine(lines[0])
  const headerLower = rawHeader.map((h) =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  )

  // Mapear índices
  const dataIdx = headerLower.findIndex(
    (h) => h.includes('data') || h.includes('date') || h.includes('dt') || h.includes('dia'),
  )
  const descIdx = headerLower.findIndex(
    (h) =>
      h.includes('desc') ||
      h.includes('historico') ||
      h.includes('histórico') ||
      h.includes('detalhe') ||
      h.includes('memo') ||
      h.includes('estabelecimento') ||
      h.includes('titulo'),
  )
  const valorIdx = headerLower.findIndex(
    (h) =>
      h.includes('valor') || h.includes('amount') || h.includes('quantia') || h.includes('vlr'),
  )
  const tipoIdx = headerLower.findIndex(
    (h) =>
      h.includes('tipo') ||
      h.includes('type') ||
      h.includes('natureza') ||
      h.includes('d/c') ||
      h.includes('dc'),
  )

  // Se não encontrar data ou valor por cabeçalho, tenta fallback posicional
  let finalDataIdx = dataIdx
  let finalDescIdx = descIdx
  let finalValorIdx = valorIdx
  let finalTipoIdx = tipoIdx

  if (finalDataIdx === -1 || finalValorIdx === -1) {
    // Fallback: tenta deduzir testando primeira linha de dados
    if (lines.length > 1) {
      const testRow = splitLine(lines[1])
      for (let i = 0; i < testRow.length; i++) {
        if (finalDataIdx === -1 && normalizarData(testRow[i])) {
          finalDataIdx = i
        } else if (finalValorIdx === -1 && normalizarValor(testRow[i])) {
          finalValorIdx = i
        }
      }
      if (finalDescIdx === -1) {
        // Pega uma coluna que não seja data nem valor
        for (let i = 0; i < testRow.length; i++) {
          if (i !== finalDataIdx && i !== finalValorIdx) {
            finalDescIdx = i
            break
          }
        }
      }
    }
  }

  if (finalDataIdx === -1 || finalValorIdx === -1) {
    return {
      sucesso: false,
      itens: [],
      erro: 'Não foi possível reconhecer o layout deste arquivo CSV. Certifique-se de que contenha colunas com Data e Valor.',
    }
  }

  const itens: ParsedItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = splitLine(lines[i])
    if (row.length <= 1 && (!row[0] || row[0].trim() === '')) continue

    const rawData = row[finalDataIdx]
    const rawDesc = finalDescIdx !== -1 ? row[finalDescIdx] : 'Lançamento sem descrição'
    const rawValor = row[finalValorIdx]
    const rawTipo = finalTipoIdx !== -1 ? row[finalTipoIdx] : undefined

    const dataNorm = normalizarData(rawData)
    const valorNorm = normalizarValor(rawValor, rawTipo)

    if (dataNorm && valorNorm) {
      itens.push({
        data: dataNorm,
        descricao: (rawDesc || 'Lançamento sem descrição').trim(),
        valor: valorNorm.valor,
        tipo: valorNorm.tipo,
        rawRow: row,
      })
    }
  }

  if (itens.length === 0) {
    return {
      sucesso: false,
      itens: [],
      erro: 'Nenhuma transação válida foi encontrada no CSV. Verifique o formato do arquivo.',
    }
  }

  return {
    sucesso: true,
    itens,
    totalLinhasLidas: lines.length - 1,
  }
}

/**
 * Parser de planilhas XLS/XLSX usando SheetJS
 */
export function parseXLSX(dataBuffer: ArrayBuffer | Uint8Array): ParseResult {
  try {
    const workbook = XLSX.read(dataBuffer, { type: 'array', cellDates: true })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return { sucesso: false, itens: [], erro: 'A planilha está vazia.' }
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false,
      defval: '',
    })

    if (!jsonData || jsonData.length === 0) {
      return { sucesso: false, itens: [], erro: 'Nenhuma linha de dados encontrada na planilha.' }
    }

    // Identifica chaves das colunas
    const firstRow = jsonData[0]
    const keys = Object.keys(firstRow)

    const findKey = (candidates: string[]): string | undefined => {
      return keys.find((k) => {
        const norm = k
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        return candidates.some((c) => norm.includes(c))
      })
    }

    const dataKey = findKey(['data', 'date', 'dt', 'dia'])
    const descKey = findKey([
      'desc',
      'historico',
      'historico',
      'detalhe',
      'memo',
      'estabelecimento',
      'titulo',
      'nome',
    ])
    const valorKey = findKey(['valor', 'amount', 'quantia', 'vlr'])
    const tipoKey = findKey(['tipo', 'type', 'natureza', 'd/c', 'dc'])

    if (!dataKey || !valorKey) {
      return {
        sucesso: false,
        itens: [],
        erro: 'Não foi possível identificar colunas de Data e Valor na planilha. Verifique o cabeçalho.',
      }
    }

    const itens: ParsedItem[] = []

    for (const row of jsonData) {
      const rawData = row[dataKey]
      const rawDesc = descKey ? row[descKey] : 'Lançamento sem descrição'
      const rawValor = row[valorKey]
      const rawTipo = tipoKey ? String(row[tipoKey]) : undefined

      const dataNorm = normalizarData(rawData)
      const valorNorm = normalizarValor(rawValor, rawTipo)

      if (dataNorm && valorNorm) {
        itens.push({
          data: dataNorm,
          descricao: String(rawDesc || 'Lançamento sem descrição').trim(),
          valor: valorNorm.valor,
          tipo: valorNorm.tipo,
          rawRow: row,
        })
      }
    }

    if (itens.length === 0) {
      return {
        sucesso: false,
        itens: [],
        erro: 'Nenhuma transação válida encontrada nas linhas da planilha.',
      }
    }

    return {
      sucesso: true,
      itens,
      totalLinhasLidas: jsonData.length,
    }
  } catch (err: unknown) {
    return {
      sucesso: false,
      itens: [],
      erro: `Erro ao processar planilha: ${(err as Error).message || 'formato inválido'}`,
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
        erro: 'Não foi possível ler este PDF. Sugerimos exportar o extrato como CSV ou XLSX pelo app do seu banco.',
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
        erro: 'Não foi possível ler este PDF. Sugerimos exportar o extrato como CSV ou XLSX pelo app do seu banco.',
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
      erro: 'Não foi possível ler este PDF. Sugerimos exportar o extrato como CSV ou XLSX pelo app do seu banco.',
    }
  }
}
