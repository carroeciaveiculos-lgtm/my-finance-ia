import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { CampoInput } from '@/components/ui/campo-input'
import { Botao } from '@/components/ui/botao'
import { Mail, Lock, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { JAMES_MICROCOPY } from '@/lib/james'

export const Login: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!email.trim() || !password) {
      setErro('Por favor, preencha seu e-mail e sua senha.')
      return
    }

    setCarregando(true)
    const { error } = await signIn(email.trim(), password)
    setCarregando(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErro('E-mail ou senha incorretos. Verifique seus dados.')
      } else {
        setErro(error.message || 'Ocorreu um erro ao entrar. Tente novamente.')
      }
      return
    }

    navigate(from, { replace: true })
  }

  const handlePreencherUsuario = (userEmail: string, pass: string) => {
    setEmail(userEmail)
    setPassword(pass)
    setErro(null)
  }

  return (
    <div className="min-h-screen bg-creme flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Cabeçalho da Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-verde-floresta to-verde-sage items-center justify-center text-white text-2xl shadow-md">
            🌱
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            My Finance IA
          </h1>
          <p className="text-sm text-texto-apoio">
            Seu jardim financeiro inteligente, acolhedor e seguro.
          </p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-lg border-verde-menta">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Acessar sua conta</CardTitle>
            <CardDescription className="text-center text-xs">
              Digite seu e-mail e senha cadastrados para continuar.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {erro && (
              <div className="mb-4 p-3 rounded-xl bg-vermelho-suave/10 border border-vermelho-suave/30 text-vermelho-suave text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <CampoInput
                rotulo="E-mail"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                iconeEsquerda={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />

              <CampoInput
                rotulo="Senha"
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconeEsquerda={<Lock className="h-4 w-4" />}
                required
                autoComplete="current-password"
              />

              <Botao
                type="submit"
                variant="primary"
                className="w-full font-semibold"
                carregando={carregando}
              >
                <span>Entrar no Sistema</span>
              </Botao>
            </form>

            {/* Acesso rápido para validação/teste */}
            <div className="mt-6 pt-5 border-t border-verde-menta space-y-2">
              <p className="text-[11px] font-semibold text-texto-apoio text-center uppercase tracking-wider">
                Usuários de Acesso Rápido (Etapa 1)
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handlePreencherUsuario('nutriadrianaaraujo22@gmail.com', 'Luga94@@')
                  }
                  className="p-2 text-left rounded-xl bg-verde-menta/50 border border-verde-menta hover:bg-verde-menta transition-colors text-texto-principal"
                >
                  <p className="font-semibold text-verde-floresta flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-verde-sucesso" /> Adriana
                  </p>
                  <p className="text-[10px] text-texto-apoio truncate">nutriadrianaaraujo22@...</p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePreencherUsuario('luizfernandora72@gmail.com', 'Luga94@@')}
                  className="p-2 text-left rounded-xl bg-verde-menta/50 border border-verde-menta hover:bg-verde-menta transition-colors text-texto-principal"
                >
                  <p className="font-semibold text-verde-floresta flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-verde-sucesso" /> Luiz Fernando
                  </p>
                  <p className="text-[10px] text-texto-apoio truncate">luizfernandora72@...</p>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center pt-2 pb-6 border-t border-verde-menta/60">
            <p className="text-xs text-texto-apoio">
              Ainda não tem conta?{' '}
              <Link to="/cadastro" className="font-semibold text-verde-floresta hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Microcopy Acolhedora James */}
        <div className="text-center space-y-1">
          <p className="text-xs text-texto-apoio flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-dourado" />
            <span>{JAMES_MICROCOPY.feedbackIncentivo}</span>
          </p>
          <p className="text-[11px] text-texto-apoio/80 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-verde-sucesso" />
            <span>{JAMES_MICROCOPY.protecaoDados}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
export default Login
