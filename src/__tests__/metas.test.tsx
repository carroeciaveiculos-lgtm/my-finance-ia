import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MetasPage, { getCorProgressoMeta, formatarMoeda } from '@/pages/Metas'
import { metasService } from '@/services/metasService'

describe('ETAPA 5 — Módulo de Metas e Objetivos Financeiros', () => {
  const mockMetas = [
    {
      id: 'meta-1',
      user_id: 'user-1',
      nome: 'Reserva de Emergência 6 Meses',
      valor_objetivo: 20000,
      valor_atual: 18000,
      data_limite: '2026-12-31',
      status: 'ativa',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'meta-2',
      user_id: 'user-1',
      nome: 'Viagem para a Serra Gaúcha',
      valor_objetivo: 5000,
      valor_atual: 2500,
      data_limite: '2026-08-15',
      status: 'ativa',
      created_at: '2026-02-01',
      updated_at: '2026-02-01',
    },
    {
      id: 'meta-3',
      user_id: 'user-1',
      nome: 'Curso de Especialização',
      valor_objetivo: 3000,
      valor_atual: 500,
      data_limite: null,
      status: 'ativa',
      created_at: '2026-03-01',
      updated_at: '2026-03-01',
    },
    {
      id: 'meta-4',
      user_id: 'user-1',
      nome: 'Comprar Notebook Novo',
      valor_objetivo: 6000,
      valor_atual: 6000,
      data_limite: '2026-04-01',
      status: 'concluida',
      created_at: '2026-01-10',
      updated_at: '2026-04-01',
    },
  ]

  it('1. Deve calcular cores da barra de progresso conforme percentual', () => {
    // 0% -> Vermelho suave (#C0392B)
    const progresso0 = getCorProgressoMeta(0, 'ativa')
    expect(progresso0.cor).toBe('#C0392B')

    // 25% -> Vermelho suave (#C0392B)
    const progresso25 = getCorProgressoMeta(25, 'ativa')
    expect(progresso25.cor).toBe('#C0392B')

    // 50% -> Dourado (#D4A853)
    const progresso50 = getCorProgressoMeta(50, 'ativa')
    expect(progresso50.cor).toBe('#D4A853')

    // 80% -> Verde Sucesso (#2E8B57)
    const progresso80 = getCorProgressoMeta(80, 'ativa')
    expect(progresso80.cor).toBe('#2E8B57')

    // 100% -> Verde Sucesso (#2E8B57)
    const progresso100 = getCorProgressoMeta(100, 'concluida')
    expect(progresso100.cor).toBe('#2E8B57')
  })

  it('2. Deve formatar moeda brasileira corretamente', () => {
    expect(formatarMoeda(1000)).toContain('1.000,00')
    expect(formatarMoeda(50.5)).toContain('50,50')
  })

  it('3. Renderiza lista de metas com progresso, % concluído e dados reais', async () => {
    vi.spyOn(metasService, 'listar').mockResolvedValue({
      data: mockMetas,
      error: null,
    })

    render(
      <MemoryRouter>
        <MetasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Reserva de Emergência 6 Meses')).toBeInTheDocument()
    })

    expect(screen.getByText('Viagem para a Serra Gaúcha')).toBeInTheDocument()
    expect(screen.getByText('Curso de Especialização')).toBeInTheDocument()
    expect(screen.getByText('Comprar Notebook Novo')).toBeInTheDocument()

    // 18000 / 20000 = 90%
    expect(screen.getByText('90%')).toBeInTheDocument()
    // 2500 / 5000 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument()
    // 500 / 3000 = 17%
    expect(screen.getByText('17%')).toBeInTheDocument()
    // 6000 / 6000 = 100%
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('4. Renderiza estado vazio acolhedor quando não há metas', async () => {
    vi.spyOn(metasService, 'listar').mockResolvedValue({
      data: [],
      error: null,
    })

    render(
      <MemoryRouter>
        <MetasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma meta ainda. Que tal definir seu primeiro objetivo financeiro?'),
      ).toBeInTheDocument()
    })
  })

  it('5. Permite abrir modal de criação de nova meta', async () => {
    vi.spyOn(metasService, 'listar').mockResolvedValue({
      data: [],
      error: null,
    })

    render(
      <MemoryRouter>
        <MetasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Nova Meta')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Nova Meta'))

    expect(screen.getByText('Nova Meta Financeira')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nome do Objetivo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Valor Alvo/i)).toBeInTheDocument()
  })
})
