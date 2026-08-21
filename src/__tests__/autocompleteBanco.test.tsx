import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AutocompleteBanco } from '@/components/AutocompleteBanco'
import * as brasilApiService from '@/services/brasilApi'

const mockBancos = [
  { ispb: '00000000', name: 'BCO DO BRASIL S.A.', code: 1, fullName: 'Banco do Brasil S.A.' },
  { ispb: '60701190', name: 'ITAÚ UNIBANCO S.A.', code: 341, fullName: 'Itaú Unibanco S.A.' },
  {
    ispb: '18236120',
    name: 'NU PAGAMENTOS - IP',
    code: 260,
    fullName: 'Nu Pagamentos S.A. (Nubank)',
  },
]

describe('Componente AutocompleteBanco', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(brasilApiService, 'buscarTodosBancos').mockResolvedValue(mockBancos)
  })

  it('1. Deve renderizar o input de busca de banco com acessibilidade combobox', () => {
    render(<AutocompleteBanco onSelectBanco={vi.fn()} />)
    const input = screen.getByRole('combobox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
  })

  it('2. Deve abrir a lista suspensa ao focar/digitar e exibir bancos retornados da Brasil API', async () => {
    render(<AutocompleteBanco onSelectBanco={vi.fn()} />)
    const input = screen.getByRole('combobox')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Itaú' } })

    await waitFor(() => {
      expect(screen.getByText(/ITAÚ UNIBANCO S.A./i)).toBeInTheDocument()
    })
  })

  it('3. Deve chamar onSelectBanco com nome e código formatado ao clicar em um banco', async () => {
    const onSelectMock = vi.fn()
    render(<AutocompleteBanco onSelectBanco={onSelectMock} />)
    const input = screen.getByRole('combobox')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '341' } })

    await waitFor(() => {
      expect(screen.getByText(/ITAÚ UNIBANCO S.A./i)).toBeInTheDocument()
    })

    const itauOpcao = screen.getByRole('option', { name: /341 ITAÚ UNIBANCO S.A./i })
    fireEvent.click(itauOpcao)

    expect(onSelectMock).toHaveBeenCalledWith({
      nome: 'ITAÚ UNIBANCO S.A.',
      codigo: '341',
    })
  })

  it('4. Deve navegar com teclado (setas para baixo, para cima, Enter e fechar com Escape)', async () => {
    const onSelectMock = vi.fn()
    render(<AutocompleteBanco onSelectBanco={onSelectMock} />)
    const input = screen.getByRole('combobox')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByText(/BCO DO BRASIL S.A./i)).toBeInTheDocument()
    })

    // Seta para baixo foca no primeiro (Banco do Brasil)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    // Seta para baixo foca no segundo (Itaú)
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    // Pressiona Enter
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSelectMock).toHaveBeenCalledWith({
      nome: 'ITAÚ UNIBANCO S.A.',
      codigo: '341',
    })

    // Abre novamente e fecha com Escape
    fireEvent.change(input, { target: { value: 'Nu' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('5. Deve exibir estado vazio quando nenhum banco for encontrado', async () => {
    render(<AutocompleteBanco onSelectBanco={vi.fn()} />)
    const input = screen.getByRole('combobox')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'BancoInexistente999' } })

    await waitFor(() => {
      expect(screen.getByText(/Nenhum banco encontrado/i)).toBeInTheDocument()
    })
  })
})
