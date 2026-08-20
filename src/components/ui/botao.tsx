import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const botaoVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-sage focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primário: fundo verde-floresta (#2F6B4F), texto branco, hover escurece (#265a40)
        primary: 'bg-verde-floresta text-white hover:bg-[#265a40] active:scale-[0.99] shadow-sm',
        // Secundário: outline verde-floresta, fundo transparente
        secondary:
          'border-2 border-verde-floresta text-verde-floresta bg-transparent hover:bg-verde-menta hover:text-verde-floresta',
        // Apoio / Menta
        menta: 'bg-verde-menta text-verde-floresta hover:bg-verde-sage/20',
        // Dourado / James
        dourado: 'bg-dourado text-texto-principal font-semibold hover:bg-[#c49b47] shadow-sm',
        // Destrutivo / Erro suave
        danger: 'bg-vermelho-suave text-white hover:bg-[#a93226]',
        // Ghost / Transparente
        ghost: 'hover:bg-verde-menta text-texto-principal hover:text-verde-floresta',
        link: 'text-verde-floresta underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-8 text-base font-semibold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface BotaoProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof botaoVariants> {
  carregando?: boolean
}

const Botao = React.forwardRef<HTMLButtonElement, BotaoProps>(
  ({ className, variant, size, carregando = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(botaoVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || carregando}
        {...props}
      >
        {carregando && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  },
)
Botao.displayName = 'Botao'

export { Botao, botaoVariants }
export default Botao
