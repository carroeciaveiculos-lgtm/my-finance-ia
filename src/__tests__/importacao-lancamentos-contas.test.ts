import { describe, it, expect } from 'vitest'
import {
  normalizarData,
  normalizarValor,
  normalizarHeader,
  parseCSV,
  parseXLSX,
  parsePDF,
  detectarDelimitador,
  COLUNAS_ESPERADAS_AJUDA,
} from '@/services/importacaoParser'
import { classificarEAutoCategorizar } from '@/services/importacaoEngine'
import type { Lancamento, Categoria } from '@/types'
import * as XLSX from 'xlsx'

describe('PARSER DE IMPORTAÇÃO — Reconhecimento Flexível de Formatos e Extensões', () => {
  describe('1. Normalização de Datas', () => {
    it('deve converter DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY e DD.MM.YYYY para YYYY-MM-DD', () => {
      expect(normalizarData('15/03/2026')).toBe('2026-03-15')
      expect(normalizarData('2026-03-15')).toBe('2026-03-15')
      expect(normalizarData('01/01/2026')).toBe('2026-01-01')
      expect(normalizarData('15-03-2026')).toBe('2026-03-15')
      expect(normalizarData('15.03.2026')).toBe('2026-03-15')
      expect(normalizarData(null)).toBeNull()
      expect(normalizarData('invalido')).toBeNull()
    })
  })

  describe('2. Normalização de Valores Financeiros', () => {
    it('deve lidar com formato brasileiro, negativo, parênteses e sufixo D/C', () => {
      expect(normalizarValor('1.250,50')).toEqual({ valor: 1250.5, tipo: 'receita' })
      expect(normalizarValor('-150,00')).toEqual({ valor: 150.0, tipo: 'despesa' })
      expect(normalizarValor('(89,90)')).toEqual({ valor: 89.9, tipo: 'despesa' })
      expect(normalizarValor('R$ 450,00 D')).toEqual({ valor: 450.0, tipo: 'despesa' })
      expect(normalizarValor('300.50 C')).toEqual({ valor: 300.5, tipo: 'receita' })
      expect(normalizarValor('0,00')).toBeNull()
    })
  })

  describe('3. Variações de Nomes de Coluna (Data do Movimento, Valor R$, etc.)', () => {
    it('deve importar CSV de banco brasileiro com "Data do Movimento" e "Valor (R$)"', () => {
      const csvBanco = `Data do Movimento;Histórico do Lançamento;Valor (R$)
10/03/2026;Supermercado Pão de Açúcar;-250,75
11/03/2026;TED Salário Empresa;6500,00
12/03/2026;Farmácia São Paulo;-45,80`

      const res = parseCSV(csvBanco)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(3)
      expect(res.itens[0].data).toBe('2026-03-10')
      expect(res.itens[0].descricao).toBe('Supermercado Pão de Açúcar')
      expect(res.itens[0].valor).toBe(250.75)
      expect(res.itens[0].tipo).toBe('despesa')

      expect(res.itens[1].data).toBe('2026-03-11')
      expect(res.itens[1].descricao).toBe('TED Salário Empresa')
      expect(res.itens[1].valor).toBe(6500)
      expect(res.itens[1].tipo).toBe('receita')
    })

    it('deve reconhecer colunas com variações como "Dt.", "Data Lançamento", "Valor R$", "Memorando"', () => {
      const csv = `Dt.,Memorando,Valor R$
05/04/2026,Posto de Gasolina Shell,-180.00
06/04/2026,Pix Recebido Cliente,350.00`

      const res = parseCSV(csv)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(2)
      expect(res.itens[0].data).toBe('2026-04-05')
      expect(res.itens[0].descricao).toBe('Posto de Gasolina Shell')
      expect(res.itens[0].valor).toBe(180)
      expect(res.itens[0].tipo).toBe('despesa')
    })
  })

  describe('4. Colunas Separadas de Débito e Crédito (ou Saída / Entrada)', () => {
    it('deve processar CSV com colunas Débito e Crédito separadas', () => {
      const csvDebCred = `Data;Descrição;Débito;Crédito
01/03/2026;Aluguel Apartamento;1800,00;
02/03/2026;Transferência Recebida;;2500,00
03/03/2026;Conta de Energia;145,50;`

      const res = parseCSV(csvDebCred)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(3)
      expect(res.itens[0].valor).toBe(1800)
      expect(res.itens[0].tipo).toBe('despesa')
      expect(res.itens[1].valor).toBe(2500)
      expect(res.itens[1].tipo).toBe('receita')
      expect(res.itens[2].valor).toBe(145.5)
      expect(res.itens[2].tipo).toBe('despesa')
    })

    it('deve processar CSV com colunas Saída e Entrada separadas', () => {
      const csvSaidaEntrada = `Data,Histórico,Saída,Entrada
15/03/2026,Restaurante Italiano,95.00,
16/03/2026,Reembolso Viagem,,120.00`

      const res = parseCSV(csvSaidaEntrada)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(2)
      expect(res.itens[0].tipo).toBe('despesa')
      expect(res.itens[0].valor).toBe(95)
      expect(res.itens[1].tipo).toBe('receita')
      expect(res.itens[1].valor).toBe(120)
    })
  })

  describe('5. Linhas de Cabeçalho Extras e Metadados do Banco', () => {
    it('deve pular linhas de título bancário, período e saldo anterior até a linha de colunas', () => {
      const csvComMetadados = `BANCO DO BRASIL S.A. - EXTRATO DE CONTA CORRENTE
Agência: 1234-5  Conta: 98765-4  Titular: Maria Silva
Período: 01/03/2026 a 31/03/2026
Saldo Anterior: R$ 1.500,00

Data;Histórico;Valor;Saldo
10/03/2026;Compra Supermercado;-120,50;1379,50
12/03/2026;Pix Recebido;500,00;1879,50
15/03/2026;Pagamento Boleto;-85,00;1794,50

Total Consolidado: R$ 1.794,50`

      const res = parseCSV(csvComMetadados)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(3)
      expect(res.itens[0].descricao).toBe('Compra Supermercado')
      expect(res.itens[0].valor).toBe(120.5)
      expect(res.itens[0].tipo).toBe('despesa')
      expect(res.itens[1].descricao).toBe('Pix Recebido')
      expect(res.itens[1].valor).toBe(500)
      expect(res.itens[1].tipo).toBe('receita')
    })
  })

  describe('6. Detecção Robusta de Delimitadores (; , \\t |)', () => {
    it('deve processar CSV delimitado por ponto e vírgula (;)', () => {
      const csv = `Data;Historico;Valor\n20/03/2026;Uber Viagens;-32,50\n21/03/2026;Pix Recebido Amigo;100,00`
      const res = parseCSV(csv)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(2)
      expect(res.itens[0].valor).toBe(32.5)
    })

    it('deve processar CSV delimitado por tabulação (\\t - TSV)', () => {
      const tsv = `Data\tDescricao\tValor\n10/03/2026\tCurso Online\t-199.90\n11/03/2026\tDividendos\t45.00`
      const res = parseCSV(tsv)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(2)
      expect(res.itens[0].descricao).toBe('Curso Online')
      expect(res.itens[0].valor).toBe(199.9)
      expect(res.itens[0].tipo).toBe('despesa')
    })

    it('deve processar CSV delimitado por pipe (|)', () => {
      const pipeCsv = `Data|Historico|Valor\n01/04/2026|Internet Fibra|-129,90\n02/04/2026|Freelance|1500,00`
      const res = parseCSV(pipeCsv)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(2)
      expect(res.itens[0].valor).toBe(129.9)
    })
  })

  describe('7. Planilhas Excel (.xls e .xlsx)', () => {
    it('deve importar planilha XLSX com cabeçalho padrão', () => {
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

    it('deve importar planilha XLSX com linhas de cabeçalho extras e colunas Débito/Crédito', () => {
      const wsData = [
        ['EXTRATO CONSOLIDADO BANCO INTER'],
        ['Período: Março/2026'],
        [''],
        ['Data do Movimento', 'Histórico', 'Débito', 'Crédito'],
        ['10/03/2026', 'Restaurante Por Quilo', 42.5, ''],
        ['11/03/2026', 'Depósito Boleto', '', 800.0],
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Movimentações')
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

      const res = parseXLSX(buffer)
      expect(res.sucesso).toBe(true)
      expect(res.itens).toHaveLength(2)
      expect(res.itens[0].descricao).toBe('Restaurante Por Quilo')
      expect(res.itens[0].valor).toBe(42.5)
      expect(res.itens[0].tipo).toBe('despesa')
      expect(res.itens[1].descricao).toBe('Depósito Boleto')
      expect(res.itens[1].valor).toBe(800)
      expect(res.itens[1].tipo).toBe('receita')
    })
  })

  describe('8. PDF e Mensagens de Erro Orientativas (Regra Ética Anti-Alucinação)', () => {
    it('quando PDF for irreconhecível, deve retornar erro explicativo sem gerar dado falso', async () => {
      const invalidBuffer = new Uint8Array([1, 2, 3, 4, 5])
      const res = await parsePDF(invalidBuffer)
      expect(res.sucesso).toBe(false)
      expect(res.itens).toHaveLength(0)
      expect(res.erro).toContain('Não foi possível ler este arquivo PDF')
      expect(res.erro).toContain('Sugerimos exportar o extrato como CSV ou XLSX')
    })

    it('quando CSV for irreconhecível, deve retornar orientações detalhadas de colunas esperadas', () => {
      const csvInvalido = `Nome,Email,Telefone\nJoão,joao@teste.com,1199999999`
      const res = parseCSV(csvInvalido)
      expect(res.sucesso).toBe(false)
      expect(res.itens).toHaveLength(0)
      expect(res.erro).toContain('Não foi possível reconhecer o layout')
      expect(res.erro).toContain('Data')
      expect(res.erro).toContain('Valor')
      expect(res.erro).toContain('Internet Banking')
    })
  })
})

describe('MOTOR DE DEDUPLICAÇÃO E AUTO-CATEGORIZAÇÃO', () => {
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

  it('1. Deduplicação: transação com mesma data, valor e descrição vai para já_existe', () => {
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

  it('2. Auto-categorização: lançamento histórico com mesma descrição em nova data herda categoria', () => {
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

  it('3. Sem histórico: lançamento não inventa categoria e vai para revisão', () => {
    const itensExtraidos = [
      {
        data: '2026-03-25',
        descricao: 'Loja Inédita XYZ',
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
