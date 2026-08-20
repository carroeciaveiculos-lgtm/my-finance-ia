import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Clock, ArrowLeft, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ModuloEmBreveProps {
  titulo: string
  etapa: string
  descricao: string
}

export const ModuloEmBreve: React.FC<ModuloEmBreveProps> = ({ titulo, etapa, descricao }) => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-8">
      <Card className="border-verde-menta shadow-sm text-center">
        <CardHeader className="pb-4 items-center">
          <div className="h-16 w-16 rounded-2xl bg-verde-menta text-verde-floresta flex items-center justify-center mb-2">
            <Clock className="h-8 w-8 text-verde-floresta" />
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-verde-menta text-verde-floresta border border-verde-sage/40">
            {etapa}
          </span>
          <CardTitle className="text-2xl mt-2">{titulo}</CardTitle>
          <CardDescription className="text-sm max-w-md mx-auto">{descricao}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="p-4 rounded-xl bg-creme border border-verde-menta text-xs text-texto-apoio flex items-center justify-center gap-2">
            <Bot className="h-4 w-4 text-dourado" />
            <span>
              Este módulo está previsto no cronograma de 12 etapas e será implementado na sua
              respectiva etapa.
            </span>
          </div>

          <Botao variant="secondary" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Dashboard</span>
          </Botao>
        </CardContent>
      </Card>
    </div>
  )
}
export default ModuloEmBreve
