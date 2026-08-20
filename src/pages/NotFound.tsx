import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Home } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-creme flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-verde-menta items-center justify-center text-verde-floresta text-2xl font-bold shadow-sm">
          404
        </div>

        <Card className="shadow-lg border-verde-menta">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Página não encontrada</CardTitle>
            <CardDescription className="text-xs">
              A página que você está procurando não existe ou mudou de endereço.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Link to="/dashboard">
              <Botao variant="primary" className="w-full gap-2">
                <Home className="h-4 w-4" />
                <span>Voltar ao Início</span>
              </Botao>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default NotFound
