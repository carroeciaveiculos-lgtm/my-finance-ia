import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CampoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string
  erro?: string
  dica?: string
  iconeEsquerda?: React.ReactNode
  iconeDireita?: React.ReactNode
}

const CampoInput = React.forwardRef<HTMLInputElement, CampoInputProps>(
  ({ className, type, rotulo, erro, dica, iconeEsquerda, iconeDireita, id, ...props }, ref) => {
    const inputId = id || (rotulo ? rotulo.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5 text-left">
        {rotulo && (
          <label htmlFor={inputId} className="block text-sm font-medium text-texto-principal">
            {rotulo}
          </label>
        )}
        <div className="relative flex items-center">
          {iconeEsquerda && (
            <div className="absolute left-3 flex items-center pointer-events-none text-texto-apoio">
              {iconeEsquerda}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-11 w-full rounded-lg border border-verde-menta bg-white px-3.5 py-2 text-sm text-texto-principal shadow-sm transition-colors',
              'placeholder:text-texto-apoio/60',
              'focus-visible:outline-none focus-visible:border-verde-sage focus-visible:ring-2 focus-visible:ring-verde-sage/40',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              iconeEsquerda && 'pl-10',
              iconeDireita && 'pr-10',
              erro &&
                'border-vermelho-suave focus-visible:border-vermelho-suave focus-visible:ring-vermelho-suave/30',
              className,
            )}
            ref={ref}
            {...props}
          />
          {iconeDireita && (
            <div className="absolute right-3 flex items-center text-texto-apoio">
              {iconeDireita}
            </div>
          )}
        </div>
        {erro ? (
          <p className="text-xs font-medium text-vermelho-suave animate-fade-in">{erro}</p>
        ) : dica ? (
          <p className="text-xs text-texto-apoio">{dica}</p>
        ) : null}
      </div>
    )
  },
)
CampoInput.displayName = 'CampoInput'

export { CampoInput }
export default CampoInput
