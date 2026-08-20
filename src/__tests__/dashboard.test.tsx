import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'
import * as useAuthHook from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

describe('ETAPA 4 — Dashboard com Gráficos (Recharts) e Dados Reais', () => {
  it('1. Renderiza estado de loading inicial com mensagem acolhedora', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'user-teste-123', email: 'adriana@exemplo.com' } as any,
      profile: {
        id: 'user-teste-123',
        nome: 'Adriana Araújo',
        email: 'adriana@exemplo.com',
        created_at: null,
      },
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    // Mock supabase query pending
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves -> stays loading
        }),
      }),
    } as any)

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    expect(screen.getByText('Cultivando seu jardim financeiro...')).toBeInTheDocument()
  })

  it('2. Renderiza estado vazio (empty) quando não há lançamentos', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'user-empty', email: 'adriana@exemplo.com' } as any,
      profile: {
        id: 'user-empty',
        nome: 'Adriana Araújo',
        email: 'adriana@exemplo.com',
        created_at: null,
      },
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    } as any)

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum lançamento ainda. Que tal plantar as primeiras sementes?'),
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Ir para Lançamentos')).toBeInTheDocument()
    expect(
      screen.getByText(/Seu jardim financeiro está esperando as primeiras sementes!/i),
    ).toBeInTheDocument()
  })

  it('3. Renderiza KPIs reais, Saudação personalizada e Gráficos quando há lançamentos', async () => {
    const hoje = new Date()
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-15`

    const mockLancamentos = [
      {
        id: '1',
        user_id: 'user-com-dados',
        tipo: 'receita',
        valor: 5000,
        data: mesAtual,
        descricao: 'Salário',
        categoria_id: 'cat-salario',
        categoria: { nome: 'Salário', tipo: 'receita' },
        categorias: { nome: 'Salário', tipo: 'receita' },
      },
      {
        id: '2',
        user_id: 'user-com-dados',
        tipo: 'despesa',
        valor: 1500,
        data: mesAtual,
        descricao: 'Supermercado',
        categoria_id: 'cat-alimentacao',
        categoria: { nome: 'Alimentação', tipo: 'despesa' },
        categorias: { nome: 'Alimentação', tipo: 'despesa' },
      },
    ]

    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'user-com-dados', email: 'adriana@exemplo.com' } as any,
      profile: {
        id: 'user-com-dados',
        nome: 'Adriana Araújo',
        email: 'adriana@exemplo.com',
        created_at: null,
      },
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockLancamentos,
            error: null,
          }),
        }),
      }),
    } as any)

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Adriana\. Como está seu jardim financeiro hoje\?/i),
      ).toBeInTheDocument()
    })

    // Saldo Total: 5000 - 1500 = 3500
    expect(screen.getByText('Saldo Total')).toBeInTheDocument()
    expect(screen.getByText('Receitas')).toBeInTheDocument()
    expect(screen.getByText('Despesas')).toBeInTheDocument()
    expect(screen.getByText('Economia')).toBeInTheDocument()

    // Economia: (5000 - 1500) / 5000 = 70.0%
    expect(screen.getByText('70,0%')).toBeInTheDocument()

    // Widget do James: > 10% economia
    expect(
      screen.getByText(/Seu jardim está florescendo, Adriana! Você economizou 70,0% este mês\./i),
    ).toBeInTheDocument()

    // Título dos gráficos
    expect(screen.getByText('Evolução: Receitas vs Despesas')).toBeInTheDocument()
    expect(screen.getByText('Despesas por Categoria')).toBeInTheDocument()
  })

  it('4. Renderiza estado de erro com botão de tentar novamente', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'user-erro', email: 'adriana@exemplo.com' } as any,
      profile: { id: 'user-erro', nome: 'Adriana', email: 'adriana@exemplo.com', created_at: null },
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Erro de conexão com o banco de dados' },
          }),
        }),
      }),
    } as any)

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível carregar seu jardim financeiro.'),
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })
})
