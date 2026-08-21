export interface BancoBrasilAPI {
  ispb: string
  name: string
  code: number | null
  fullName: string
}

const BRASIL_API_BANKS_URL = 'https://brasilapi.com.br/api/banks/v1'
const CACHE_TTL_MS = 60 * 1000 // 1 minuto de cache

let cacheBancos: BancoBrasilAPI[] | null = null
let cacheTimestamp = 0
let fetchPromise: Promise<BancoBrasilAPI[]> | null = null

/**
 * Busca a lista completa de bancos da Brasil API com cache em memória de 1 minuto.
 */
export async function buscarTodosBancos(): Promise<BancoBrasilAPI[]> {
  const agora = Date.now()
  if (cacheBancos && agora - cacheTimestamp < CACHE_TTL_MS) {
    return cacheBancos
  }

  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch(BRASIL_API_BANKS_URL)
      if (!response.ok) {
        throw new Error(`Erro ao consultar Brasil API: ${response.status} ${response.statusText}`)
      }
      const data: BancoBrasilAPI[] = await response.json()
      // Filtra e normaliza os dados
      const bancosValidos = Array.isArray(data) ? data : []
      cacheBancos = bancosValidos
      cacheTimestamp = Date.now()
      return bancosValidos
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}

/**
 * Normaliza string removendo acentos e convertendo para minúsculas para busca flexível.
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Filtra a lista de bancos por texto (busca por nome, fullName ou código COMPE).
 */
export function filtrarBancos(bancos: BancoBrasilAPI[], termo: string): BancoBrasilAPI[] {
  const termoNorm = normalizarTexto(termo)
  if (!termoNorm) return bancos

  return bancos.filter((banco) => {
    const codeStr = banco.code !== null && banco.code !== undefined ? String(banco.code) : ''
    const codePadded = codeStr ? codeStr.padStart(3, '0') : ''
    const nameNorm = normalizarTexto(banco.name || '')
    const fullNameNorm = normalizarTexto(banco.fullName || '')

    return (
      codeStr.includes(termoNorm) ||
      codePadded.includes(termoNorm) ||
      nameNorm.includes(termoNorm) ||
      fullNameNorm.includes(termoNorm)
    )
  })
}

/**
 * Limpa o cache para testes ou reinicialização.
 */
export function limparCacheBancos(): void {
  cacheBancos = null
  cacheTimestamp = 0
  fetchPromise = null
}
