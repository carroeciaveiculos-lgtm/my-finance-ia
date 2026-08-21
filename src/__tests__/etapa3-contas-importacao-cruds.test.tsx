import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ContasPage } from '../pages/Contas'
import { CategoriasSection } from '../pages/Categorias'
import { StatusSection } from '../pages/Status'
import { GruposSection } from '../pages/Grupos'
import { ImportacaoPage } from '../pages/Importacao'
import { statusService } from '../services/status'
import { gruposService } from '../services/grupos'
import { categoriasService } from '../services/categorias'
import { contasService } from '../services/contas'
import { documentosService } from '../services/documentos'
import { lancamentosService } from '../services/lancamentos'

// Mock services
vi.mock('../services/status', () => ({
  statusService: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
    contarContasUsando: vi.fn(),
  },
}))

vi.mock('../services/grupos', () => ({
  gruposService: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
    contarContasUsando: vi.fn(),
  },
}))

vi.mock('../services/categorias', () => ({
  categoriasService: {
    listar: vi.fn(),
    listarArvore: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
    contarLancamentosUsando: vi.fn(),
  },
}))

vi.mock('../services/contas', () => ({
  contasService: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
  },
}))

vi.mock('../services/documentos', () => ({
  documentosService: {
    listar: vi.fn(),
    criar: vi.fn(),
    excluirApenasRegistro: vi.fn(),
    excluirDocumentoELancamentos: vi.fn(),
    contarLancamentos: vi.fn(),
    excluir: vi.fn(),
  },
}))

vi.mock('../services/lancamentos', () => ({
  lancamentosService: {
    listar: vi.fn(),
    criar: vi.fn(),
  },
}))

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('Ajustes da Etapa 3 — Contas, Categorias, Status, Grupos e Importação', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(statusService.listar).mockResolvedValue({
      data: [
        { id: '1', user_id: null, nome: 'Ativa', cor: '#2E8B57', created_at: '', updated_at: '' },
        { id: '2', user_id: null, nome: 'Inativa', cor: '#9CA3AF', created_at: '', updated_at: '' },
      ],
      error: null,
    })

    vi.mocked(gruposService.listar).mockResolvedValue({
      data: [
        {
          id: '1',
          user_id: null,
          nome: 'Dia a Dia',
          cor: '#3B82F6',
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          user_id: null,
          nome: 'Reservas',
          cor: '#2E8B57',
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    })

    vi.mocked(categoriasService.listarArvore).mockResolvedValue({
      data: [
        {
          id: 'cat-1',
          user_id: null,
          nome: 'Moradia',
          tipo: 'despesa',
          categoria_pai_id: null,
          created_at: '',
          updated_at: '',
          subcategorias: [
            {
              id: 'sub-1',
              user_id: null,
              nome: 'Aluguel / Financiamento',
              tipo: 'despesa',
              categoria_pai_id: 'cat-1',
              created_at: '',
              updated_at: '',
            },
          ],
        },
        {
          id: 'cat-2',
          user_id: null,
          nome: 'Renda',
          tipo: 'receita',
          categoria_pai_id: null,
          created_at: '',
          updated_at: '',
          subcategorias: [],
        },
      ],
      error: null,
    })

    vi.mocked(contasService.listar).mockResolvedValue({
      data: [
        {
          id: 'conta-1',
          user_id: 'user-1',
          nome: 'Nubank Principal',
          tipo: 'conta_corrente',
          banco: 'Nubank',
          saldo_inicial: 1500,
          status_id: '1',
          grupo_id: '1',
          status: {
            id: '1',
            user_id: null,
            nome: 'Ativa',
            cor: '#2E8B57',
            created_at: '',
            updated_at: '',
          },
          grupo: {
            id: '1',
            user_id: null,
            nome: 'Dia a Dia',
            cor: '#3B82F6',
            created_at: '',
            updated_at: '',
          },
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    })

    vi.mocked(lancamentosService.listar).mockResolvedValue({
      data: [],
      error: null,
    })

    vi.mocked(documentosService.listar).mockResolvedValue({
      data: [
        {
          id: 'doc-1',
          user_id: 'user-1',
          nome_arquivo: 'extrato-maio.ofx',
          tipo: 'ofx',
          total_lancamentos: 15,
          total_valor: 3500,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    })
  })

  it('deve renderizar a página de Contas com abas (Contas, Categorias, Status, Grupos)', async () => {
    render(
      <BrowserRouter>
        <ContasPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Contas & Carteiras')).toBeInTheDocument()
    expect(screen.getByText(/Categorias & Subcategorias/i)).toBeInTheDocument()
    expect(screen.getByText(/Status/i)).toBeInTheDocument()
    expect(screen.getByText(/Grupos/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Nubank Principal')).toBeInTheDocument()
      expect(screen.getByText('Ativa')).toBeInTheDocument()
      expect(screen.getByText('Dia a Dia')).toBeInTheDocument()
    })
  })

  it('deve listar categorias com hierarquia e badges de sistema', async () => {
    render(
      <BrowserRouter>
        <CategoriasSection />
      </BrowserRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Moradia')).toBeInTheDocument()
      expect(screen.getByText('Aluguel / Financiamento')).toBeInTheDocument()
      expect(screen.getByText('Renda')).toBeInTheDocument()
    })
  })

  it('deve listar status padrão do sistema protegidos', async () => {
    render(
      <BrowserRouter>
        <StatusSection />
      </BrowserRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Ativa')).toBeInTheDocument()
      expect(screen.getByText('Inativa')).toBeInTheDocument()
    })
  })

  it('deve listar grupos organizacionais', async () => {
    render(
      <BrowserRouter>
        <GruposSection />
      </BrowserRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Dia a Dia')).toBeInTheDocument()
      expect(screen.getByText('Reservas')).toBeInTheDocument()
    })
  })

  it('deve carregar a página de Importação sem ErrorBoundary com suporte a multi-upload e histórico', async () => {
    render(
      <BrowserRouter>
        <ImportacaoPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Importação de Extratos & Comprovantes')).toBeInTheDocument()
    expect(screen.getByText(/Upload de Arquivos em Lote/i)).toBeInTheDocument()
    expect(screen.getByText('Seleção Múltipla Ativa')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('extrato-maio.ofx')).toBeInTheDocument()
      expect(screen.getByText('15 lançamentos')).toBeInTheDocument()
    })
  })
})
