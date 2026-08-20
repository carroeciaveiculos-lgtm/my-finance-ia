import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Sparkles,
  Bot,
  FileSpreadsheet,
  Target,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { JAMES_LEIS, JAMES_TONE, JAMES_MICROCOPY } from '@/lib/james'

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth()
  const [modalJamesAberto, setModalJamesAberto] = useState(false)

  const nomeExibicao =
    profile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Adriana'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ======================================================== */}
      {/* 1. HERO WIDGET JAMES — DESTAQUE COM GRADIENTE E DOURADO  */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-verde-menta via-verde-menta/70 to-verde-sage/30 p-6 sm:p-8 border border-dourado/40 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar circular com borda dourada conforme Design System */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-verde-floresta flex items-center justify-center text-white shadow-md ring-4 ring-dourado/80 ring-offset-2 ring-offset-creme">
                <Bot className="h-8 w-8 sm:h-9 sm:w-9 text-dourado" />
              </div>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-verde-sucesso ring-2 ring-white" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-verde-floresta">
                  James • Assistente Pessoal de Finanças
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-dourado/20 text-texto-principal px-2 py-0.5 rounded-full border border-dourado/40">
                  <Sparkles className="h-3 w-3 text-dourado" />
                  Tom {JAMES_TONE}
                </span>
              </div>
              <p className="text-sm text-texto-principal">
                &ldquo;Olá, <strong>{nomeExibicao}</strong>! Estou pronto para organizar seu jardim
                financeiro com base estrita nos seus dados reais.&rdquo;
              </p>
              <p className="text-xs text-texto-apoio flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-verde-sucesso inline" />
                <span>{JAMES_MICROCOPY.feedbackIncentivo} (5 Leis Éticas Ativas)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Botao
              variant="dourado"
              size="sm"
              onClick={() => setModalJamesAberto(true)}
              className="gap-2 shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ver 5 Leis do James</span>
            </Botao>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRADE DE CARDS KPI (ESTRUTURA BASE COM NÚMEROS TABULARES) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Saldo Consolidado */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-texto-apoio">Saldo em Contas</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-verde-menta flex items-center justify-center text-verde-floresta">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tabular text-texto-principal">R$ 0,00</div>
            <p className="text-xs text-texto-apoio mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Aguardando primeiros lançamentos</span>
            </p>
          </CardContent>
        </Card>

        {/* Card Receitas Previstas */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-texto-apoio">Receitas do Mês</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-verde-sucesso/10 flex items-center justify-center text-verde-sucesso">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tabular text-verde-sucesso">+ R$ 0,00</div>
            <p className="text-xs text-texto-apoio mt-1 flex items-center gap-1">
              <span>Módulo Lançamentos (Etapa 3)</span>
            </p>
          </CardContent>
        </Card>

        {/* Card Despesas Previstas */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-texto-apoio">Despesas do Mês</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-vermelho-suave/10 flex items-center justify-center text-vermelho-suave">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tabular text-vermelho-suave">- R$ 0,00</div>
            <p className="text-xs text-texto-apoio mt-1 flex items-center gap-1">
              <span>Módulo Lançamentos (Etapa 3)</span>
            </p>
          </CardContent>
        </Card>

        {/* Card Investimentos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-texto-apoio">
              Patrimônio Investido
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-dourado/20 flex items-center justify-center text-dourado">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tabular text-texto-principal">R$ 0,00</div>
            <p className="text-xs text-texto-apoio mt-1 flex items-center gap-1">
              <span>Módulo Investimentos (Etapa 6)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 3. CARDS DE ESTRUTURA DOS PRÓXIMOS MÓDULOS (EM BREVE)    */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-base text-verde-floresta">
            Módulos do Sistema (Cronograma das 12 Etapas)
          </h3>
          <span className="text-xs font-medium text-texto-apoio">
            Etapa 1: Estrutura Base Ativa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Módulo Lançamentos & Importação */}
          <Card className="border-verde-menta hover:border-verde-sage transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-verde-menta text-verde-floresta flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-verde-menta text-verde-floresta border border-verde-sage/30">
                  Etapa 3
                </span>
              </div>
              <CardTitle className="text-base mt-2">Lançamentos & Extratos</CardTitle>
              <CardDescription className="text-xs">
                Importação inteligente via CSV, OFX e plano B de PDF com bucket privado seguro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-xl bg-creme border border-verde-menta/70 text-xs text-texto-apoio flex items-center justify-between">
                <span>Status da Base de Dados</span>
                <span className="font-medium text-verde-sucesso">Bucket pronto</span>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Metas Financeiras */}
          <Card className="border-verde-menta hover:border-verde-sage transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-verde-menta text-verde-floresta flex items-center justify-center">
                  <Target className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-verde-menta text-verde-floresta border border-verde-sage/30">
                  Etapa 5
                </span>
              </div>
              <CardTitle className="text-base mt-2">Metas & Reservas</CardTitle>
              <CardDescription className="text-xs">
                Acompanhamento visual de objetivos de curto, médio e longo prazo com o James.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-xl bg-creme border border-verde-menta/70 text-xs text-texto-apoio flex items-center justify-between">
                <span>Estrutura</span>
                <span className="font-medium text-texto-principal">Em breve</span>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Dívidas & Oportunidades */}
          <Card className="border-verde-menta hover:border-verde-sage transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-verde-menta text-verde-floresta flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-verde-menta text-verde-floresta border border-verde-sage/30">
                  Etapa 6
                </span>
              </div>
              <CardTitle className="text-base mt-2">Dívidas, Consórcios & Seguros</CardTitle>
              <CardDescription className="text-xs">
                Gestão de apólices, contratos, taxa de juros e amortização inteligente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-xl bg-creme border border-verde-menta/70 text-xs text-texto-apoio flex items-center justify-between">
                <span>Estrutura</span>
                <span className="font-medium text-texto-principal">Em breve</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. INFRAESTRUTURA & STATUS DO SISTEMA                     */}
      {/* ======================================================== */}
      <Card className="border-verde-menta bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-verde-floresta" />
              <span>Status dos Serviços e Infraestrutura Base</span>
            </CardTitle>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-verde-sucesso bg-verde-sucesso/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Operacional
            </span>
          </div>
          <CardDescription className="text-xs">
            Visão técnica da infraestrutura configurada para este projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-creme border border-verde-menta">
              <p className="font-semibold text-verde-floresta mb-0.5">Autenticação Supabase</p>
              <p className="text-texto-apoio">Sessão ativa com criptografia bcrypt e RLS.</p>
            </div>
            <div className="p-3 rounded-xl bg-creme border border-verde-menta">
              <p className="font-semibold text-verde-floresta mb-0.5">Keep-Alive Supabase</p>
              <p className="text-texto-apoio">
                Worker Cron 48h ativo para mitigar pausa de 7 dias.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-creme border border-verde-menta">
              <p className="font-semibold text-verde-floresta mb-0.5">Storage Privado</p>
              <p className="text-texto-apoio">
                Bucket &quot;extratos&quot; configurado com RLS por usuário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal das Leis do James */}
      <Modal
        aberto={modalJamesAberto}
        aoFechar={() => setModalJamesAberto(false)}
        titulo="O Código de Ética do James"
        descricao="Diretrizes do seu assistente de inteligência financeira."
        tamanho="lg"
        rodape={<Botao onClick={() => setModalJamesAberto(false)}>Compreendi</Botao>}
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-verde-menta to-verde-sage/30 border border-dourado/40 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-verde-floresta flex items-center justify-center text-dourado ring-2 ring-dourado shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-verde-floresta">Tom: {JAMES_TONE}</p>
              <p className="text-texto-apoio text-xs">{JAMES_MICROCOPY.resumoJardim}</p>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(JAMES_LEIS).map(([chave, lei], index) => (
              <div
                key={chave}
                className="p-3 rounded-xl bg-creme border border-verde-menta flex gap-3 items-start"
              >
                <span className="h-5 w-5 rounded-full bg-verde-floresta text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <p className="text-texto-principal text-xs leading-relaxed">{lei}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
export default Dashboard
