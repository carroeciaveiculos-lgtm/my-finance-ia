import type { Lancamento, Categoria, TipoLancamento } from '@/types'
import type { ParsedItem } from './importacaoParser'

export type GrupoPrevia = 'vai_lancar' | 'ja_existe' | 'precisa_revisao'

export interface ItemPreviaImportacao {
  idTemp: string
  data: string // YYYY-MM-DD
  descricao: string
  valor: number
  tipo: TipoLancamento
  grupo: GrupoPrevia
  motivoGrupo: string
  categoria_id: string | null
  subcategoria_id: string | null
  categoriaNomeSugerida?: string
  subcategoriaNomeSugerida?: string
  duplicataCorrespondente?: Lancamento
  selecionadoParaSalvar: boolean
}

/**
 * Normaliza strings para comparação case-insensitive, sem espaços duplicados e sem acentos
 */
export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Processa a lista de itens extraídos do documento contra os lançamentos existentes no banco do usuário.
 * Aplica:
 * 1. Deduplicação estrita (100% data + valor + descrição normalizada)
 * 2. Detecção de correspondência parcial / incerteza (precisa de revisão)
 * 3. Auto-categorização estrita por histórico idêntico (nunca chuta)
 */
export function classificarEAutoCategorizar({
  itensExtraidos,
  lancamentosExistentes,
  categorias,
}: {
  itensExtraidos: ParsedItem[]
  lancamentosExistentes: Lancamento[]
  categorias: Categoria[]
}): ItemPreviaImportacao[] {
  // Mapa de histórico para auto-categorização:
  // Chave: descricao normalizada -> { categoria_id, subcategoria_id }
  const mapaHistorico = new Map<string, { categoria_id: string; subcategoria_id: string | null }>()

  // Popula mapa a partir de lançamentos existentes que já tenham categoria definida
  for (const lanc of lancamentosExistentes) {
    if (lanc.descricao && lanc.categoria_id) {
      const chave = normalizarTexto(lanc.descricao)
      if (chave && !mapaHistorico.has(chave)) {
        mapaHistorico.set(chave, {
          categoria_id: lanc.categoria_id,
          subcategoria_id: lanc.subcategoria_id || null,
        })
      }
    }
  }

  // Mapa rápido de busca de categorias por ID
  const mapaCategorias = new Map<string, Categoria>()
  for (const cat of categorias) {
    mapaCategorias.set(cat.id, cat)
  }

  return itensExtraidos.map((item, idx) => {
    const idTemp = `item-previa-${idx}-${Date.now()}`
    const descNorm = normalizarTexto(item.descricao)
    const valorNum = Number(item.valor.toFixed(2))

    // 1. Verificar duplicata exata (100% de certeza: mesma data, mesmo valor com precisão e mesma descrição)
    const duplicataExata = lancamentosExistentes.find((existente) => {
      const dataBate = existente.data === item.data
      const valorBate = Math.abs(Number(existente.valor) - valorNum) < 0.009
      const descBate = normalizarTexto(existente.descricao) === descNorm
      return dataBate && valorBate && descBate
    })

    if (duplicataExata) {
      return {
        idTemp,
        data: item.data,
        descricao: item.descricao,
        valor: valorNum,
        tipo: item.tipo,
        grupo: 'ja_existe',
        motivoGrupo: 'Lançamento já existe no banco com mesma data, valor e descrição exata.',
        categoria_id: duplicataExata.categoria_id,
        subcategoria_id: duplicataExata.subcategoria_id,
        duplicataCorrespondente: duplicataExata,
        selecionadoParaSalvar: false, // Não duplicar por padrão
      }
    }

    // 2. Verificar correspondência parcial / duvidosa (mesma data e mesmo valor, porém descrição levemente diferente)
    const correspondenciaParcial = lancamentosExistentes.find((existente) => {
      const dataBate = existente.data === item.data
      const valorBate = Math.abs(Number(existente.valor) - valorNum) < 0.009
      return dataBate && valorBate
    })

    // 3. Tentar auto-categorização estrita por histórico anterior
    let categoriaId: string | null = null
    let subcategoriaId: string | null = null
    let categoriaNomeSugerida: string | undefined
    let subcategoriaNomeSugerida: string | undefined

    const categoriaHistorico = descNorm ? mapaHistorico.get(descNorm) : undefined
    if (categoriaHistorico) {
      categoriaId = categoriaHistorico.categoria_id
      subcategoriaId = categoriaHistorico.subcategoria_id
      const catObj = mapaCategorias.get(categoriaId)
      if (catObj) categoriaNomeSugerida = catObj.nome
      if (subcategoriaId) {
        const subCatObj = mapaCategorias.get(subcategoriaId)
        if (subCatObj) subcategoriaNomeSugerida = subCatObj.nome
      }
    }

    // Se houver correspondência parcial de valor/data com outro lançamento existente, colocar em revisão
    if (correspondenciaParcial) {
      return {
        idTemp,
        data: item.data,
        descricao: item.descricao,
        valor: valorNum,
        tipo: item.tipo,
        grupo: 'precisa_revisao',
        motivoGrupo: `Possível duplicata: existe lançamento de R$ ${valorNum.toFixed(2)} em ${item.data} ("${correspondenciaParcial.descricao}"). Verifique antes de lançar.`,
        categoria_id: categoriaId,
        subcategoria_id: subcategoriaId,
        categoriaNomeSugerida,
        subcategoriaNomeSugerida,
        duplicataCorrespondente: correspondenciaParcial,
        selecionadoParaSalvar: true,
      }
    }

    // Se o lançamento for totalmente novo, mas NÃO tem categoria encontrada:
    // Também vai para a lista de "vai_lancar" ou se sem categoria pode ir para "precisa_revisao"
    if (!categoriaId) {
      return {
        idTemp,
        data: item.data,
        descricao: item.descricao,
        valor: valorNum,
        tipo: item.tipo,
        grupo: 'precisa_revisao',
        motivoGrupo:
          'Sem categoria histórica correspondente. Por favor, categorize manualmente antes de confirmar.',
        categoria_id: null,
        subcategoria_id: null,
        selecionadoParaSalvar: true,
      }
    }

    // Caso ideal: Novo lançamento + categoria histórica encontrada
    return {
      idTemp,
      data: item.data,
      descricao: item.descricao,
      valor: valorNum,
      tipo: item.tipo,
      grupo: 'vai_lancar',
      motivoGrupo: `Novo lançamento. Categoria "${categoriaNomeSugerida}" identificada pelo histórico.`,
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId,
      categoriaNomeSugerida,
      subcategoriaNomeSugerida,
      selecionadoParaSalvar: true,
    }
  })
}
