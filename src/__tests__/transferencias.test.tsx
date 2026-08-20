import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LancamentosPage from '@/pages/Lancamentos'
import { lancamentosService } from '@/services/lancamentos'
import { contasService } from '@/services/contas'
import { categoriasService } from '@/services/categorias'

describe('TAREFA 1 — Transferências entre Contas & Lançamentos', () => {
  const mockContas = [
    {
      id: 'conta-corrente',
      user_id: 'user-1',
      nome: 'Conta Corrente Nubank',
      tipo: 'conta_corrente' as const,
      banco: 'Nubank',
      saldo_inicial: 2000,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'cartao-credito',
      user_id: 'user-1',
      nome: 'Cartão de Crédito Nubank',
      tipo: 'cartao_credito' as const,
      banco: 'Nubank',
      saldo_inicial: 0,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ]

  const mockLancamentos = [
    {
      id: 'lanc-1',
      user_id: 'user-1',
      tipo: 'receita' as const,
      valor: 5000,
      data: '2026-03-05',
      descricao: 'Salário Mensal',
      categoria_id: 'cat-salario',
      subcategoria_id: null,
      conta_id: 'conta-corrente',
      conta_destino_id: null,
      documento_id: null,
      created_at: '2026-03-05',
      updated_at: '2026-03-05',
      categoria: {
        id: 'cat-salario',
        user_id: null,
        nome: 'Salário',
        tipo: 'receita' as const,
        categoria_pai_id: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      conta: mockContas[0],
    },
    {
      id: 'lanc-2',
      user_id: 'user-1',
      tipo: 'despesa' as const,
      valor: 1500,
      data: '2026-03-10',
      descricao: 'Supermercado',
      categoria_id: 'cat-alimentacao',
      subcategoria_id: null,
      conta_id: 'conta-corrente',
      conta_destino_id: null,
      documento_id: null,
      created_at: '2026-03-10',
      updated_at: '2026-03-10',
      categoria: {
        id: 'cat-alimentacao',
        user_id: null,
        nome: 'Alimentação',
        tipo: 'despesa' as const,
        categoria_pai_id: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      conta: mockContas[0],
    },
    {
      id: 'lanc-3',
      user_id: 'user-1',
      tipo: 'transferencia' as const,
      valor: 800,
      data: '2026-03-15',
      descricao: 'Pagamento de Fatura Cartão',
      categoria_id: null,
      subcategoria_id: null,
      conta_id: 'conta-corrente',
      conta_destino_id: 'cartao-credito',
      documento_id: null,
      created_at: '2026-03-15',
      updated_at: '2026-03-15',
      categoria: null,
      conta: mockContas[0],
      conta_destino: mockContas[1],
    },
  ]

  it('1. Transferência NÃO distorce totais de receitas e despesas nos cards', async () => {
    vi.spyOn(lancamentosService, 'listar').mockResolvedValue({
      data: mockLancamentos,
      error: null,
    })
    vi.spyOn(contasService, 'listar').mockResolvedValue({
      data: mockContas,
      error: null,
    })
    vi.spyOn(categoriasService, 'listarArvore').mockResolvedValue({
      data: [],
      error: null,
    })

    render(
      <MemoryRouter>
        <LancamentosPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Pagamento de Fatura Cartão')).toBeInTheDocument()
    })

    // Total Receitas deve ser 5000 (R$ 5.000,00)
    expect(screen.getByText('Total Receitas')).toBeInTheDocument()
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument()

    // Total Despesas deve ser 1500 (R$ 1.500,00) - NÃO 2300!
    expect(screen.getByText('Total Despesas')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()

    // Card separado de Transferências deve mostrar 800 (R$ 800,00)
    expect(screen.getByText('Transferências')).toBeInTheDocument()
    expect(screen.getByText('R$ 800,00')).toBeInTheDocument()

    // Saldo do período deve ser 3500 (5000 - 1500 = 3500)
    expect(screen.getByText('Saldo do Período')).toBeInTheDocument()
    expect(screen.getByText('R$ 3.500,00')).toBeInTheDocument()
  })

  it('2. Listagem identifica visualmente transferência com conta origem e destino', async () => {
    vi.spyOn(lancamentosService, 'listar').mockResolvedValue({
      data: mockLancamentos,
      error: null,
    })
    vi.spyOn(contasService, 'listar').mockResolvedValue({
      data: mockContas,
      error: null,
    })
    vi.spyOn(categoriasService, 'listarArvore').mockResolvedValue({
      data: [],
      error: null,
    })

    render(
      <MemoryRouter>
        <LancamentosPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Pagamento de Fatura Cartão')).toBeInTheDocument()
    })

    // Badge / Rótulo Transferência
    expect(screen.getByText('Transferência')).toBeInTheDocument()
    // Identificação de transferência interna
    expect(screen.getByText('Transferência interna')).toBeInTheDocument()
  })

  it('3. Modal de criação exibe campos de conta origem e destino quando tipo = transferencia', async () => {
    vi.spyOn(lancamentosService, 'listar').mockResolvedValue({
      data: [],
      error: null,
    })
    vi.spyOn(contasService, 'listar').mockResolvedValue({
      data: mockContas,
      error: null,
    })
    vi.spyOn(categoriasService, 'listarArvore').mockResolvedValue({
      data: [],
      error: null,
    })

    render(
      <MemoryRouter>
        <LancamentosPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Novo Lançamento')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Novo Lançamento'))

    // Clica no botão Transferência do toggle
    const botaoTransferencia = screen.getByText('Transferência')
    fireEvent.click(botaoTransferencia)

    expect(screen.getByText(/Conta Origem \(Sai Dinheiro\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Conta Destino \(Entra \/ Fatura\)/i)).toBeInTheDocument()
  })
})
