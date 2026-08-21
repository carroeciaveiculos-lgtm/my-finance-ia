import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const ComponenteComErro = () => {
  throw new Error('Erro simulado de renderização')
}

const ComponenteSemErro = () => {
  return <div>Conteúdo carregado com sucesso</div>
}

describe('ErrorBoundary Component', () => {
  it('1. Deve renderizar os children quando não houver erro', () => {
    render(
      <ErrorBoundary>
        <ComponenteSemErro />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Conteúdo carregado com sucesso')).toBeInTheDocument()
  })

  it('2. Deve capturar erros de renderização e exibir tela amigável com botão Tentar Novamente', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallbackTitle="Falha de teste">
        <ComponenteComErro />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Falha de teste')).toBeInTheDocument()
    expect(screen.getByText('Erro simulado de renderização')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('3. Deve chamar onReset quando o botão "Tentar novamente" for clicado', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onResetMock = vi.fn()

    render(
      <ErrorBoundary onReset={onResetMock}>
        <ComponenteComErro />
      </ErrorBoundary>,
    )

    const btnReset = screen.getByText('Tentar novamente')
    fireEvent.click(btnReset)

    expect(onResetMock).toHaveBeenCalledTimes(1)

    consoleSpy.mockRestore()
  })
})
