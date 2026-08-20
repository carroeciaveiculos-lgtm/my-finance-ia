import { describe, it, expect } from 'vitest'
import {
  normalizarData,
  normalizarValor,
  parseCSV,
  parseXLSX,
  parsePDF,
} from '@/services/importacaoParser'
import { classificarEAutoCategorizar } from '@/services/importacaoEngine'
import type { Lancamento, Categoria } from '@/types'
import * as XLSX from 'xlsx'

describe('ETAPA 3 — Parsers de Arquivos (CSV, XLSX, PDF)', () => {
  it('1. normalizarData deve converter corretamente vários formatos para YYYY-MM-DD', () => {
    expect(normalizarData('15/03/2026')).toBe('2026-03-15')
    expect(normalizarData('2026-03-15')).toBe('2026-03-15')
    expect(normalizarData('01/01/2026')).toBe('2026-01-01')
    expect(normalizarData('15-03-2026')).toBe('2026-03-15')
    expect(normalizarData(null)).toBeNull()
    expect(normalizarData('invalido')).toBeNull()
  })

  it('2. normalizarValor deve lidar com formato brasileiro, negativo e strings bancárias', () => {
    expect(normalizarValor('1.250,50')).toEqual({ valor: 1250.5, tipo: 'receita' })
    expect(normalizarValor('-150,00')).toEqual({ valor: 150.0, tipo: 'despesa' })
    expect(normalizarValor('(89,90)')).toEqual({ valor: 89.9, tipo: 'despesa' })
    expect(normalizarValor('R$ 450,00 D')).toEqual({ valor: 450.0, tipo: 'despesa' })
    expect(normalizarValor('300.50 C')).toEqual({ valor: 300.5, tipo: 'receita' })
    expect(normalizarValor('0,00')).toBeNull()
  })

  it('3. CSV Parser com exatamente 10 linhas de dados → deve extrair exatamente 10 lançamentos', () => {
    const csvContent = `Data,Descricao,Valor
10/03/2026,Supermercado Extra,-150.50
11/03/2026,Salario Empresa,5000.00
12/03/2026,Padaria Central,-25.00
13/03/2026,Posto Shell,-220.00
14/03/2026,Farmacia Drogasil,-85.40
15/03/2026,Restaurante Bom Sabor,-64.00
16/03/2026,Academia Smart,-119.90
17/03/2026,Rendimento CDB,45.30
18/03/2026,Internet Fibra,-129.90
19/03/2026,Conta de Luz,-180.20`

    const res = parseCSV(csvContent)
    expect(res.sucesso).toBe(true)
    expect(res.itens).toHaveLength(10)
    expect(res.itens[0].descricao).toBe('Supermercado Extra')
    expect(res.itens[0].valor).toBe(150.5)
    expect(res.itens[0].tipo).toBe('despesa')
    expect(res.itens[1].tipo).toBe('receita')
  })

  it('4. CSV com delimitador ponto e vírgula (;)', () => {
    const csvContent = `Data;Historico;Valor
20/03/2026;Uber Viagens;-32,50
21/03/2026;Pix Recebido Amigo;100,00`

    const res = parseCSV(csvContent)
    expect(res.sucesso).toBe(true)
    expect(res.itens).toHaveLength(2)
    expect(res.itens[0].descricao).toBe('Uber Viagens')
    expect(res.itens[0].valor).toBe(32.5)
    expect(res.itens[0].tipo).toBe('despesa')
    expect(res.itens[1].valor).toBe(100.0)
    expect(res.itens[1].tipo).toBe('receita')
  })

  it('5. XLSX Parser usando SheetJS', () => {
    const wsData = [
      ['Data', 'Descricao', 'Valor'],
      ['2026-03-01', 'Assinatura Netflix', -55.9],
      ['2026-03-02', 'Freelance Design', 1200.0],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Extrato')
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

    const res = parseXLSX(buffer)
    expect(res.sucesso).toBe(true)
    expect(res.itens).toHaveLength(2)
    expect(res.itens[0].descricao).toBe('Assinatura Netflix')
    expect(res.itens[0].valor).toBe(55.9)
    expect(res.itens[0].tipo).toBe('despesa')
  })

  it('6. PDF Parser: Quando não reconhecer formato estruturado, retorna erro claro sem inventar dados (Regra Ética James)', async () => {
    const invalidBuffer = new Uint8Array([1, 2, 3, 4, 5])
    const res = await parsePDF(invalidBuffer)
    expect(res.sucesso).toBe(false)
    expect(res.itens).toHaveLength(0)
    expect(res.erro).toContain(
      'Não foi possível ler este PDF. Sugerimos exportar o extrato como CSV ou XLSX',
    )
  })
})

describe('ETAPA 3 — Motor de Deduplicação e Auto-Categorização', () => {
  const categoriasMock: Categoria[] = [
    {
      id: 'cat-alimentacao',
      user_id: null,
      nome: 'Alimentação',
      tipo: 'despesa',
      categoria_pai_id: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'subcat-supermercado',
      user_id: null,
      nome: 'Supermercado',
      tipo: 'despesa',
      categoria_pai_id: 'cat-alimentacao',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'cat-transporte',
      user_id: null,
      nome: 'Transporte',
      tipo: 'despesa',
      categoria_pai_id: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ]

  const lancamentosExistentesMock: Lancamento[] = [
    {
      id: 'lanc-1',
      user_id: 'user-1',
      tipo: 'despesa',
      valor: 250.75,
      data: '2026-03-10',
      descricao: 'Supermercado Pão de Açúcar',
      categoria_id: 'cat-alimentacao',
      subcategoria_id: 'subcat-supermercado',
      conta_id: 'conta-1',
      documento_id: null,
      created_at: '2026-03-10',
      updated_at: '2026-03-10',
    },
  ]

  it('1. Deduplicação: importar mesmo CSV 2x → 0 novos lançamentos na segunda vez (vai para já_existe)', () => {
    // Transação idêntica ao lanc-1
    const itensExtraidos = [
      {
        data: '2026-03-10',
        descricao: 'Supermercado Pão de Açúcar',
        valor: 250.75,
        tipo: 'despesa' as const,
      },
    ]

    const resultado = classificarEAutoCategorizar({
      itensExtraidos,
      lancamentosExistentes: lancamentosExistentesMock,
      categorias: categoriasMock,
    })

    expect(resultado).toHaveLength(1)
    expect(resultado[0].grupo).toBe('ja_existe')
    expect(resultado[0].selecionadoParaSalvar).toBe(false)
  })

  it('2. Auto-categorização: lançamento "Supermercado Pão de Açúcar" em outra data herda categoria do histórico', () => {
    // Nova data, mesma descrição
    const itensExtraidos = [
      {
        data: '2026-03-25',
        descricao: 'Supermercado Pão de Açúcar',
        valor: 180.2,
        tipo: 'despesa' as const,
      },
    ]

    const resultado = classificarEAutoCategorizar({
      itensExtraidos,
      lancamentosExistentes: lancamentosExistentesMock,
      categorias: categoriasMock,
    })

    expect(resultado).toHaveLength(1)
    expect(resultado[0].grupo).toBe('vai_lancar')
    expect(resultado[0].categoria_id).toBe('cat-alimentacao')
    expect(resultado[0].subcategoria_id).toBe('subcat-supermercado')
    expect(resultado[0].categoriaNomeSugerida).toBe('Alimentação')
    expect(resultado[0].selecionadoParaSalvar).toBe(true)
  })

  it('3. Auto-categorização: lançamento sem histórico NUNCA chuta categoria e vai para revisão', () => {
    const itensExtraidos = [
      {
        data: '2026-03-25',
        descricao: 'Loja Desconhecida XYZ',
        valor: 99.0,
        tipo: 'despesa' as const,
      },
    ]

    const resultado = classificarEAutoCategorizar({
      itensExtraidos,
      lancamentosExistentes: lancamentosExistentesMock,
      categorias: categoriasMock,
    })

    expect(resultado).toHaveLength(1)
    expect(resultado[0].grupo).toBe('precisa_revisao')
    expect(resultado[0].categoria_id).toBeNull()
    expect(resultado[0].subcategoria_id).toBeNull()
  })
})
