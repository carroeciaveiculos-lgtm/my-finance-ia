import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import {
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { JAMES_MICROCOPY } from '@/lib/james'

export const Cadastro: React.FC = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!nome.trim()) {
      setErro('Por favor, informe seu nome completo.')
      return
    }

    if (!email.trim()) {
      setErro('Por favor, informe um endereço de e-mail válido.')
      return
    }

    if (password.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErro('As senhas digitadas não coincidem.')
      return
    }

    setCarregando(true)
    const { error } = await signUp(email.trim(), password, nome.trim())
    setCarregando(false)

    if (error) {
      setErro(error.message || 'Erro ao realizar o cadastro. Tente novamente.')
      return
    }

    setSucesso(true)
    setTimeout(() => {
      navigate('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-creme flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-verde-floresta to-verde-sage items-center justify-center text-white text-2xl shadow-md">
            🌱
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            My Finance IA
          </h1>
          <p className="text-sm text-texto-apoio">
            Comece a cuidar hoje mesmo do seu jardim financeiro.
          </p>
        </div>

        {/* Card de Cadastro */}
        <Card className="shadow-lg border-verde-menta">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Criar sua conta</CardTitle>
            <CardDescription className="text-center text-xs">
              Preencha os campos abaixo para iniciar sua jornada.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {erro && (
              <div className="mb-4 p-3 rounded-xl bg-vermelho-suave/10 border border-vermelho-suave/30 text-vermelho-suave text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {sucesso && (
              <div className="mb-4 p-3 rounded-xl bg-verde-sucesso/10 border border-verde-sucesso/30 text-verde-sucesso text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Conta criada com sucesso! Redirecionando para o Dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <CampoInput
                rotulo="Nome completo"
                type="text"
                placeholder="Ex: Adriana Araújo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                iconeEsquerda={<UserIcon className="h-4 w-4" />}
                required
              />

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
                placeholder="Crie uma senha forte (mínimo 6 dígitos)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconeEsquerda={<Lock className="h-4 w-4" />}
                required
                autoComplete="new-password"
              />

              <CampoInput
                rotulo="Confirmar senha"
                type="password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                iconeEsquerda={<Lock className="h-4 w-4" />}
                required
                autoComplete="new-password"
              />

              <Botao
                type="submit"
                variant="primary"
                className="w-full font-semibold"
                carregando={carregando}
                disabled={sucesso}
              >
                <span>Criar Conta e Iniciar</span>
              </Botao>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center pt-2 pb-6 border-t border-verde-menta/60">
            <p className="text-xs text-texto-apoio">
              Já possui uma conta?{' '}
              <Link to="/login" className="font-semibold text-verde-floresta hover:underline">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Microcopy James */}
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
export default Cadastro
