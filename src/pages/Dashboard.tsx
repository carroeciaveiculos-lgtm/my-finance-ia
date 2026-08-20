import React, { useState, useEffect, useMemo, useId } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend as RechartsLegend,
} from 'recharts'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Sparkles,
  Bot,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Calendar,
  CheckCircle2,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react'
import { JAMES_LEIS, JAMES_TONE, JAMES_MICROCOPY, getSaudacaoHorario } from '@/lib/james'

const rawClient = supabase as unknown as SupabaseClient

// Paleta de cores do Design System para categorias
const CORES_CATEGORIAS = [
  '#2F6B4F', // Verde Floresta
  '#7FB69B', // Verde Sage
  '#D4A853', // Dourado
  '#E8C87A', // Dourado Claro
  '#5A8F6C', // Verde Musgo
  '#3D7251', // Verde Oliva
  '#A8D5BA', // Menta Suave
  '#C0392B', // Vermelho Suave
]

export type PeriodoFiltro =
  | 'mes_atual'
  | 'ultimo_mes'
  | 'ultimos_3_meses'
  | 'ultimos_6_meses'
  | 'ano_atual'

interface LancamentoComCategoria {
  id: string
  user_id: string
  tipo: 'receita' | 'despesa'
  valor: number
  data: string
  descricao: string | null
  categoria_id: string | null
  categorias?: {
    nome: string
    tipo: string
  } | null
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Helper para calcular intervalos de datas
const getIntervaloPeriodo = (
  periodo: PeriodoFiltro,
): { inicio: string; fim: string; label: string } => {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() // 0-11

  const formatarDataIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (periodo === 'mes_atual') {
    const inicio = new Date(anoAtual, mesAtual, 1)
    const fim = new Date(anoAtual, mesAtual + 1, 0)
    return { inicio: formatarDataIso(inicio), fim: formatarDataIso(fim), label: 'Mês Atual' }
  }

  if (periodo === 'ultimo_mes') {
    const inicio = new Date(anoAtual, mesAtual - 1, 1)
    const fim = new Date(anoAtual, mesAtual, 0)
    return { inicio: formatarDataIso(inicio), fim: formatarDataIso(fim), label: 'Último Mês' }
  }

  if (periodo === 'ultimos_3_meses') {
    const inicio = new Date(anoAtual, mesAtual - 2, 1)
    const fim = new Date(anoAtual, mesAtual + 1, 0)
    return { inicio: formatarDataIso(inicio), fim: formatarDataIso(fim), label: 'Últimos 3 Meses' }
  }

  if (periodo === 'ultimos_6_meses') {
    const inicio = new Date(anoAtual, mesAtual - 5, 1)
    const fim = new Date(anoAtual, mesAtual + 1, 0)
    return { inicio: formatarDataIso(inicio), fim: formatarDataIso(fim), label: 'Últimos 6 Meses' }
  }

  // ano_atual
  const inicio = new Date(anoAtual, 0, 1)
  const fim = new Date(anoAtual, 11, 31)
  return { inicio: formatarDataIso(inicio), fim: formatarDataIso(fim), label: 'Ano Atual' }
}

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth()
  const [modalJamesAberto, setModalJamesAberto] = useState(false)
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes_atual')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [todosLancamentos, setTodosLancamentos] = useState<LancamentoComCategoria[]>([])

  const selectPeriodoId = useId()

  const carregarDados = async () => {
    if (!user?.id) {
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      const { data, error } = await rawClient
        .from('lancamentos')
        .select('*, categorias(nome, tipo)')
        .eq('user_id', user.id)
        .order('data', { ascending: true })

      if (error) {
        throw error
      }

      setTodosLancamentos((data as unknown as LancamentoComCategoria[]) || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao consultar lançamentos no Supabase'
      setErro(msg)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Nome do usuário
  const nomeUsuario =
    profile?.nome?.trim() ||
    user?.user_metadata?.nome?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Visitante'

  const primeiroNome = nomeUsuario.split(' ')[0]
  const saudacaoCompleta = getSaudacaoHorario(primeiroNome)

  // Intervalo do período selecionado
  const intervalo = useMemo(() => getIntervaloPeriodo(periodo), [periodo])

  // Lançamentos do período selecionado
  const lancamentosPeriodo = useMemo(() => {
    return todosLancamentos.filter((l) => {
      return l.data >= intervalo.inicio && l.data <= intervalo.fim
    })
  }, [todosLancamentos, intervalo])

  // KPIs do Período
  const receitasPeriodo = useMemo(() => {
    return lancamentosPeriodo
      .filter((l) => l.tipo === 'receita')
      .reduce((acc, l) => acc + Number(l.valor || 0), 0)
  }, [lancamentosPeriodo])

  const despesasPeriodo = useMemo(() => {
    return lancamentosPeriodo
      .filter((l) => l.tipo === 'despesa')
      .reduce((acc, l) => acc + Number(l.valor || 0), 0)
  }, [lancamentosPeriodo])

  const saldoPeriodo = receitasPeriodo - despesasPeriodo

  const taxaEconomia = useMemo(() => {
    if (receitasPeriodo === 0) return null
    return ((receitasPeriodo - despesasPeriodo) / receitasPeriodo) * 100
  }, [receitasPeriodo, despesasPeriodo])

  // Mensagem Dinâmica do James (conforme item 2.5)
  const mensagemJames = useMemo(() => {
    if (todosLancamentos.length === 0) {
      return 'Seu jardim financeiro está esperando as primeiras sementes! Cadastre suas receitas e despesas para eu te ajudar.'
    }

    if (saldoPeriodo > 0 && taxaEconomia !== null && taxaEconomia > 10) {
      const taxaFormatada = taxaEconomia.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
      return `Seu jardim está florescendo, ${primeiroNome}! Você economizou ${taxaFormatada}% este mês. Continue regando com sabedoria.`
    }

    if (saldoPeriodo > 0 && taxaEconomia !== null && taxaEconomia >= 0 && taxaEconomia <= 10) {
      return `Bom trabalho, ${primeiroNome}. Você está no azul! Pequenas economias viram grandes jardins.`
    }

    if (saldoPeriodo < 0) {
      return `O solo está pedindo atenção, ${primeiroNome}. Suas despesas superaram as receitas este mês. Que tal revisarmos juntos?`
    }

    // Caso neutro / empate (saldo === 0)
    return `Olá, ${primeiroNome}. Suas receitas e despesas estão equilibradas este mês. Que tal plantarmos uma reserva para o futuro?`
  }, [todosLancamentos.length, saldoPeriodo, taxaEconomia, primeiroNome])

  // Dados para Gráfico de Evolução (Últimos 6 meses)
  const dadosEvolucao6Meses = useMemo(() => {
    const hoje = new Date()
    const meses: { chave: string; rotulo: string; receitas: number; despesas: number }[] = []
    const nomesMeses = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const rotulo = `${nomesMeses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
      meses.push({
        chave,
        rotulo,
        receitas: 0,
        despesas: 0,
      })
    }

    todosLancamentos.forEach((l) => {
      if (!l.data) return
      const mesLanc = l.data.slice(0, 7) // YYYY-MM
      const mesObj = meses.find((m) => m.chave === mesLanc)
      if (mesObj) {
        const val = Number(l.valor || 0)
        if (l.tipo === 'receita') {
          mesObj.receitas += val
        } else if (l.tipo === 'despesa') {
          mesObj.despesas += val
        }
      }
    })

    return meses
  }, [todosLancamentos])

  // Dados para Gráfico de Rosca (Despesas por Categoria no Período Selecionado)
  const dadosCategoriasDespesas = useMemo(() => {
    const mapa = new Map<string, number>()

    lancamentosPeriodo
      .filter((l) => l.tipo === 'despesa')
      .forEach((l) => {
        const nomeCat = l.categorias?.nome || 'Sem categoria'
        const val = Number(l.valor || 0)
        mapa.set(nomeCat, (mapa.get(nomeCat) || 0) + val)
      })

    const lista = Array.from(mapa.entries()).map(([name, value]) => ({
      name,
      value,
    }))

    // Ordenar do maior para o menor
    lista.sort((a, b) => b.value - a.value)
    return lista
  }, [lancamentosPeriodo])

  const totalDespesasRosca = useMemo(() => {
    return dadosCategoriasDespesas.reduce((acc, item) => acc + item.value, 0)
  }, [dadosCategoriasDespesas])

  // ESTADO 1: LOADING
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-4 border-verde-menta border-t-verde-floresta animate-spin" />
          <Bot className="h-6 w-6 text-dourado absolute inset-0 m-auto" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-display font-semibold text-lg text-verde-floresta">
            Cultivando seu jardim financeiro...
          </p>
          <p className="text-xs text-texto-apoio">
            Carregando lançamentos e calculando métricas em tempo real.
          </p>
        </div>
      </div>
    )
  }

  // ESTADO 2: ERRO
  if (erro) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-vermelho-suave/30 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm animate-fade-in">
        <div className="h-12 w-12 rounded-full bg-vermelho-suave/10 text-vermelho-suave flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display font-bold text-lg text-texto-principal">
            Não foi possível carregar seu jardim financeiro.
          </h2>
          <p className="text-xs text-texto-apoio leading-relaxed">{erro}</p>
        </div>
        <Botao onClick={carregarDados} className="gap-2 mx-auto">
          <RefreshCw className="h-4 w-4" />
          <span>Tentar novamente</span>
        </Botao>
      </div>
    )
  }

  // ESTADO 3: EMPTY (SEM NENHUM LANÇAMENTO)
  if (todosLancamentos.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Saudação Topo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
              {saudacaoCompleta}
            </h1>
            <p className="text-sm text-texto-apoio mt-1">
              Visão consolidada em tempo real com base nos seus dados reais do Supabase.
            </p>
          </div>
        </div>

        {/* Widget do James Vazio */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-verde-menta via-verde-menta/70 to-verde-sage/30 p-6 sm:p-8 border border-dourado/40 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
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
                <p className="text-sm text-texto-principal leading-relaxed">
                  &ldquo;{mensagemJames}&rdquo;
                </p>
                <p className="text-xs text-texto-apoio flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-verde-sucesso inline" />
                  <span>{JAMES_MICROCOPY.feedbackIncentivo} (5 Leis Éticas Ativas)</span>
                </p>
              </div>
            </div>

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

        {/* Card Empty State Acolhedor */}
        <div className="p-10 sm:p-14 rounded-2xl bg-white border border-verde-menta text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-verde-menta text-verde-floresta flex items-center justify-center mx-auto shadow-sm">
            <Calendar className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="font-display font-bold text-lg sm:text-xl text-verde-floresta">
              Nenhum lançamento ainda. Que tal plantar as primeiras sementes?
            </h2>
            <p className="text-xs sm:text-sm text-texto-apoio leading-relaxed">
              Assim que você cadastrar suas primeiras receitas e despesas ou importar um extrato
              bancário, seu jardim financeiro ganhará gráficos interativos e métricas completas.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/lancamentos">
              <Botao size="default" className="gap-2 shadow-sm">
                <PlusCircle className="h-4 w-4" />
                <span>Ir para Lançamentos</span>
              </Botao>
            </Link>
          </div>
        </div>

        {/* Modal Leis do James */}
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

  // ESTADO 4: DASHBOARD COM DADOS REAIS
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ======================================================== */}
      {/* 1. CABEÇALHO & FILTRO DE PERÍODO                          */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            {saudacaoCompleta}
          </h1>
          <p className="text-sm text-texto-apoio mt-1">
            Visão consolidada em tempo real com base nos seus dados reais do Supabase.
          </p>
        </div>

        {/* Dropdown de Seleção de Período */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white p-1.5 rounded-xl border border-verde-menta shadow-sm">
          <Calendar className="h-4 w-4 text-verde-floresta ml-2 shrink-0" />
          <label htmlFor={selectPeriodoId} className="sr-only">
            Selecionar Período
          </label>
          <select
            id={selectPeriodoId}
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
            className="bg-transparent text-xs font-semibold text-texto-principal focus:outline-none pr-3 py-1 cursor-pointer"
          >
            <option value="mes_atual">Mês Atual</option>
            <option value="ultimo_mes">Último Mês</option>
            <option value="ultimos_3_meses">Últimos 3 Meses</option>
            <option value="ultimos_6_meses">Últimos 6 Meses</option>
            <option value="ano_atual">Ano Atual</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HERO WIDGET JAMES COM MENSAGEM DINÂMICA               */}
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
              <p className="text-sm text-texto-principal leading-relaxed">
                &ldquo;{mensagemJames}&rdquo;
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
      {/* 3. CARDS DE KPI (4 CARDS COM NÚMEROS TABULARES)          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Saldo Total */}
        <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border-verde-menta">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-texto-apoio uppercase tracking-wider">
              Saldo Total
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-verde-menta flex items-center justify-center text-verde-floresta">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-tabular tracking-tight ${
                saldoPeriodo >= 0 ? 'text-[#2E8B57]' : 'text-[#C0392B]'
              }`}
            >
              {formatarMoeda(saldoPeriodo)}
            </div>
            <p className="text-[11px] text-texto-apoio mt-1">Receitas menos despesas no período</p>
          </CardContent>
        </Card>

        {/* Card Receitas */}
        <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border-verde-menta">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-texto-apoio uppercase tracking-wider">
              Receitas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-[#2E8B57]/10 flex items-center justify-center text-[#2E8B57]">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tabular tracking-tight text-[#2E8B57]">
              + {formatarMoeda(receitasPeriodo)}
            </div>
            <p className="text-[11px] text-texto-apoio mt-1">Soma das entradas no período</p>
          </CardContent>
        </Card>

        {/* Card Despesas */}
        <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border-verde-menta">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-texto-apoio uppercase tracking-wider">
              Despesas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-[#C0392B]/10 flex items-center justify-center text-[#C0392B]">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tabular tracking-tight text-[#C0392B]">
              - {formatarMoeda(despesasPeriodo)}
            </div>
            <p className="text-[11px] text-texto-apoio mt-1">Soma das saídas no período</p>
          </CardContent>
        </Card>

        {/* Card Taxa de Economia */}
        <Card className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border-verde-menta">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-texto-apoio uppercase tracking-wider">
              Economia
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-dourado/20 flex items-center justify-center text-dourado">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-tabular tracking-tight ${
                taxaEconomia === null
                  ? 'text-texto-principal'
                  : taxaEconomia >= 0
                    ? 'text-[#2E8B57]'
                    : 'text-[#C0392B]'
              }`}
            >
              {taxaEconomia === null
                ? '—'
                : `${taxaEconomia.toLocaleString('pt-BR', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}%`}
            </div>
            <p className="text-[11px] text-texto-apoio mt-1">
              {taxaEconomia === null
                ? 'Sem receitas no período'
                : taxaEconomia >= 0
                  ? 'Percentual guardado da receita'
                  : 'Despesas superaram as receitas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 4. GRÁFICOS: LINHA/ÁREA (EVOLUÇÃO) + ROSCA (DESPESAS)    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Receitas vs Despesas */}
        <Card className="rounded-xl bg-white shadow-sm border-verde-menta">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-display font-semibold text-verde-floresta flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-verde-floresta" />
                  <span>Evolução: Receitas vs Despesas</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Histórico consolidado dos últimos 6 meses.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dadosEvolucao6Meses}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="corReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2F6B4F" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2F6B4F" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="corDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C0392B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C0392B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F2EC" vertical={false} />
                  <XAxis
                    dataKey="rotulo"
                    stroke="#6B7A72"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E8F2EC' }}
                  />
                  <YAxis
                    stroke="#6B7A72"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E8F2EC' }}
                    tickFormatter={(val) =>
                      `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                    }
                  />
                  <RechartsTooltip
                    formatter={(value: any, name: any) => [
                      formatarMoeda(Number(value) || 0),
                      name === 'receitas' ? 'Receitas' : 'Despesas',
                    ]}
                    labelStyle={{ fontWeight: 'bold', color: '#1F2A24' }}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E8F2EC',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    name="receitas"
                    stroke="#2F6B4F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#corReceitas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    name="despesas"
                    stroke="#C0392B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#corDespesas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-texto-apoio">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#2F6B4F]" />
                <span className="font-medium text-texto-principal">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#C0392B]" />
                <span className="font-medium text-texto-principal">Despesas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Despesas por Categoria (Rosca / Donut) */}
        <Card className="rounded-xl bg-white shadow-sm border-verde-menta">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-display font-semibold text-verde-floresta flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-verde-floresta" />
                  <span>Despesas por Categoria</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Distribuição no período: {intervalo.label}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {dadosCategoriasDespesas.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-2 p-6">
                <div className="h-12 w-12 rounded-2xl bg-verde-menta/60 text-verde-floresta flex items-center justify-center">
                  <PieIcon className="h-6 w-6" />
                </div>
                <p className="font-semibold text-sm text-texto-principal">
                  Nenhuma despesa no período
                </p>
                <p className="text-xs text-texto-apoio max-w-xs">
                  Não foram encontrados lançamentos de despesa para o período selecionado (
                  {intervalo.label}).
                </p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosCategoriasDespesas}
                      cx="50%"
                      cy="48%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosCategoriasDespesas.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CORES_CATEGORIAS[index % CORES_CATEGORIAS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any, name: any) => {
                        const valNum = Number(value) || 0
                        const pct =
                          totalDespesasRosca > 0
                            ? ((valNum / totalDespesasRosca) * 100).toFixed(1)
                            : '0'
                        return [`${formatarMoeda(valNum)} (${pct}%)`, name]
                      }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E8F2EC',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontSize: '12px',
                      }}
                    />
                    <RechartsLegend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value: any) => (
                        <span className="text-xs text-texto-principal font-medium">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
