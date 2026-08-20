import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ModalProps {
  aberto: boolean
  aoFechar: () => void
  titulo?: string
  descricao?: string
  children?: React.ReactNode
  rodape?: React.ReactNode
  tamanho?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal: React.FC<ModalProps> = ({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  rodape,
  tamanho = 'md',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    if (aberto) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  const maxLargura = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[tamanho]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-texto-principal/40 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={aoFechar} aria-hidden="true" />
      <div
        className={cn(
          'relative w-full rounded-2xl border border-verde-menta bg-white p-6 text-texto-principal shadow-xl animate-fade-in-up z-10',
          maxLargura,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-verde-menta">
          <div className="space-y-1">
            {titulo && (
              <h2 className="font-display text-xl font-semibold text-texto-principal">{titulo}</h2>
            )}
            {descricao && <p className="text-sm text-texto-apoio">{descricao}</p>}
          </div>
          <button
            onClick={aoFechar}
            className="rounded-lg p-1.5 text-texto-apoio hover:bg-verde-menta hover:text-texto-principal transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 max-h-[75vh] overflow-y-auto">{children}</div>

        {rodape && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-verde-menta">
            {rodape}
          </div>
        )}
      </div>
    </div>
  )
}
export default Modal
