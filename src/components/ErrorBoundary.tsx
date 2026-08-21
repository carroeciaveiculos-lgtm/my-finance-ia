import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Botao } from '@/components/ui/botao'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo)
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 animate-fade-in">
          <Card className="max-w-lg w-full border-vermelho-suave/30 bg-white shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="h-14 w-14 rounded-2xl bg-vermelho-suave/10 text-vermelho-suave flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-8 w-8" />
              </div>
              <CardTitle className="font-display text-xl text-verde-floresta">
                {this.props.fallbackTitle || 'Algo deu errado ao carregar esta página.'}
              </CardTitle>
              <CardDescription className="text-xs text-texto-apoio mt-1">
                {this.props.fallbackMessage ||
                  'Ocorreu uma instabilidade inesperada ao processar as informações. Você pode tentar novamente.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              {this.state.error && (
                <div className="p-3 rounded-xl bg-creme border border-verde-menta text-[11px] font-mono text-texto-principal overflow-x-auto max-h-28">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <Botao onClick={this.handleReset} className="gap-2 shadow-sm">
                  <RefreshCw className="h-4 w-4" />
                  <span>Tentar novamente</span>
                </Botao>
                <Botao
                  variant="secondary"
                  onClick={() => {
                    this.setState({ hasError: false, error: null })
                    window.location.reload()
                  }}
                  className="gap-2 shadow-sm"
                >
                  <span>Recarregar página</span>
                </Botao>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
