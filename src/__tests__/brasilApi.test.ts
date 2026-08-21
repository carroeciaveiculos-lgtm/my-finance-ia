import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  buscarTodosBancos,
  filtrarBancos,
  limparCacheBancos,
  BancoBrasilAPI,
} from '@/services/brasilApi'

const mockBancosLista: BancoBrasilAPI[] = [
  { ispb: '00000000', name: 'BCO DO BRASIL S.A.', code: 1, fullName: 'Banco do Brasil S.A.' },
  { ispb: '60701190', name: 'ITAÚ UNIBANCO S.A.', code: 341, fullName: 'Itaú Unibanco S.A.' },
  { ispb: '18236120', name: 'NU PAGAMENTOS - IP', code: 260, fullName: 'Nu Pagamentos S.A.' },
  { ispb: '60746948', name: 'BCO BRADESCO S.A.', code: 237, fullName: 'Banco Bradesco S.A.' },
  {
    ispb: '00360305',
    name: 'CAIXA ECONOMICA FEDERAL',
    code: 104,
    fullName: 'Caixa Econômica Federal',
  },
  { ispb: '07238114', name: 'BCO INTER S.A.', code: 77, fullName: 'Banco Inter S.A.' },
  { ispb: '99999999', name: 'BANCO SEM CODIGO', code: null, fullName: 'Banco Sem Codigo' },
]

describe('Serviço Brasil API - Bancos', () => {
  beforeEach(() => {
    limparCacheBancos()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    limparCacheBancos()
  })

  it('1. Deve consultar a Brasil API com sucesso e retornar array de bancos', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockBancosLista,
    } as Response)

    const bancos = await buscarTodosBancos()
    expect(fetchSpy).toHaveBeenCalledWith('https://brasilapi.com.br/api/banks/v1')
    expect(bancos).toHaveLength(7)
    expect(bancos[1].name).toBe('ITAÚ UNIBANCO S.A.')
    expect(bancos[1].code).toBe(341)
  })

  it('2. Deve utilizar cache em memória e não refazer fetch na segunda chamada dentro de 1 minuto', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockBancosLista,
    } as Response)

    const res1 = await buscarTodosBancos()
    const res2 = await buscarTodosBancos()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(res1).toEqual(res2)
  })

  it('3. Deve lidar com falha HTTP na Brasil API lançando erro explicativo', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    await expect(buscarTodosBancos()).rejects.toThrow('Erro ao consultar Brasil API: 500')
  })

  it('4. filtrarBancos: deve filtrar por nome ignorando acentos e maiúsculas/minúsculas', () => {
    const resultadoItau = filtrarBancos(mockBancosLista, 'itau')
    expect(resultadoItau).toHaveLength(1)
    expect(resultadoItau[0].code).toBe(341)

    const resultadoNu = filtrarBancos(mockBancosLista, 'nubank')
    // Na nossa lista mock não tem "nubank" no name, mas testando "nu"
    const resultadoNu2 = filtrarBancos(mockBancosLista, 'nu')
    expect(resultadoNu2.some((b) => b.code === 260)).toBe(true)

    const resultadoCaixa = filtrarBancos(mockBancosLista, 'caixa')
    expect(resultadoCaixa).toHaveLength(1)
    expect(resultadoCaixa[0].code).toBe(104)
  })

  it('5. filtrarBancos: deve filtrar por código COMPE (ex: 341, 001, 1, 260)', () => {
    const resultado341 = filtrarBancos(mockBancosLista, '341')
    expect(resultado341).toHaveLength(1)
    expect(resultado341[0].name).toBe('ITAÚ UNIBANCO S.A.')

    const resultado001 = filtrarBancos(mockBancosLista, '001')
    expect(resultado001.some((b) => b.code === 1)).toBe(true)

    const resultado1 = filtrarBancos(mockBancosLista, '1')
    expect(resultado1.some((b) => b.code === 1)).toBe(true)
  })

  it('6. filtrarBancos: quando termo estiver vazio retorna todos os bancos', () => {
    const todos = filtrarBancos(mockBancosLista, '')
    expect(todos).toHaveLength(mockBancosLista.length)
  })
})
