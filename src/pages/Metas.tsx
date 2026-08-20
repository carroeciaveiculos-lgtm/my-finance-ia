import React, { useState, useEffect, useMemo, useId } from 'react'
import { metasService, type FiltrosMetas } from '@/services/metasService'
import type { Meta, StatusMeta } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  PlayCircle,
  PauseCircle,
  Award,
} from 'lucide-react'

// Helper de formatação de moeda
export const formatarMoeda = (valor: number): string => {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Retorna cor da barra conforme percentual e status
export const getCorProgressoMeta = (
  percentual: number,
  status?: string | null,
): { cor: string; bgBadge: string; textBadge: string; borderBadge: string } => {
  if (status === 'concluida' || percentual >= 80) {
    return {
      cor: '#2E8B57', // Verde Sucesso
      bgBadge: 'bg-[#2E8B57]/10',
      textBadge: 'text-[#2E8B57]',
      borderBadge: 'border-[#2E8B57]/30',
    }
  }
  if (percentual >= 30) {
    return {
      cor: '#D4A853', // Dourado
      bgBadge: 'bg-[#D4A853]/15',
      textBadge: 'text-[#9C751D]',
      borderBadge: 'border-[#D4A853]/40',
    }
  }
  return {
    cor: '#C0392B', // Vermelho Suave
    bgBadge: 'bg-[#C0392B]/10',
    textBadge: 'text-[#C0392B]',
    borderBadge: 'border-[#C0392B]/30',
  }
}

export const MetasPage: React.FC = () => {
  const { toast } = useToast()

  const [metas, setMetas] = useState<Meta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<StatusMeta | 'todas'>('todas')

  // Modais de Criação/Edição e Exclusão
  const [modalFormAberto, setModalFormAberto] = useState(false)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [metaEmEdicao, setMetaEmEdicao] = useState<Meta | null>(null)
  const [metaParaExcluir, setMetaParaExcluir] = useState<Meta | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Form State
  const [formNome, setFormNome] = useState('')
  const [formValorObjetivo, setFormValorObjetivo] = useState('')
  const [formValorAtual, setFormValorAtual] = useState('0,00')
  const [formDataLimite, setFormDataLimite] = useState('')
  const [formStatus, setFormStatus] = useState<StatusMeta>('ativa')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const nomeFormId = useId()
  const objetivoFormId = useId()
  const atualFormId = useId()
  const dataLimiteFormId = useId()
  const statusFormId = useId()

  const carregarDados = async () => {
    setCarregando(true)
    const res = await metasService.listar()
    if (res.error) {
      toast({
        title: 'Erro ao carregar metas',
        description: res.error.message,
        variant: 'destructive',
      })
    } else {
      setMetas(res.data || [])
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const metasFiltradas = useMemo(() => {
    if (filtroStatus === 'todas') return metas
    return metas.filter((m) => m.status === filtroStatus)
  }, [metas, filtroStatus])

  // KPIs
  const totalMetas = metas.length
  const metasAtivas = metas.filter((m) => m.status === 'ativa').length
  const metasConcluidas = metas.filter((m) => m.status === 'concluida').length
  const totalPoupado = metas.reduce((acc, m) => acc + Number(m.valor_atual || 0), 0)

  const abrirModalNovo = () => {
    setMetaEmEdicao(null)
    setFormNome('')
    setFormValorObjetivo('')
    setFormValorAtual('0,00')
    setFormDataLimite('')
    setFormStatus('ativa')
    setErroForm(null)
    setModalFormAberto(true)
  }

  const abrirModalEditar = (meta: Meta) => {
    setMetaEmEdicao(meta)
    setFormNome(meta.nome)
    setFormValorObjetivo(
      Number(meta.valor_objetivo).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
    setFormValorAtual(
      Number(meta.valor_atual || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
    setFormDataLimite(meta.data_limite || '')
    setFormStatus((meta.status as StatusMeta) || 'ativa')
    setErroForm(null)
    setModalFormAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formNome.trim()) {
      setErroForm('Informe o nome da meta financeira.')
      return
    }

    const valorObjLimpo = formValorObjetivo.replace(/\./g, '').replace(',', '.')
    const valorObjNum = parseFloat(valorObjLimpo)
    if (isNaN(valorObjNum) || valorObjNum <= 0) {
      setErroForm('Informe um valor objetivo válido maior que zero.')
      return
    }

    const valorAtualLimpo = (formValorAtual || '0').replace(/\./g, '').replace(',', '.')
    const valorAtualNum = parseFloat(valorAtualLimpo)
    if (isNaN(valorAtualNum) || valorAtualNum < 0) {
      setErroForm('O valor atual acumulado deve ser um número válido igual ou superior a zero.')
      return
    }

    // Auto-ajuste de status: se atingiu o valor e está ativa, sugere/marca concluída
    let statusFinal = formStatus
    if (valorAtualNum >= valorObjNum && formStatus === 'ativa') {
      statusFinal = 'concluida'
    }

    setSalvando(true)
    setErroForm(null)

    if (metaEmEdicao) {
      const { error } = await metasService.atualizar(metaEmEdicao.id, {
        nome: formNome.trim(),
        valor_objetivo: valorObjNum,
        valor_atual: valorAtualNum,
        data_limite: formDataLimite || null,
        status: statusFinal,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Meta atualizada com sucesso!' })
        setModalFormAberto(false)
        carregarDados()
      }
    } else {
      const { error } = await metasService.criar({
        nome: formNome.trim(),
        valor_objetivo: valorObjNum,
        valor_atual: valorAtualNum,
        data_limite: formDataLimite || null,
        status: statusFinal,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Meta financeira criada com sucesso!' })
        setModalFormAberto(false)
        carregarDados()
      }
    }
    setSalvando(false)
  }

  const handleConfirmarExcluir = async () => {
    if (!metaParaExcluir) return
    setExcluindo(true)
    const { error } = await metasService.excluir(metaParaExcluir.id)
    if (error) {
      toast({
        title: 'Erro ao excluir meta',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Meta excluída com sucesso.' })
      setModalExcluirAberto(false)
      setMetaParaExcluir(null)
      carregarDados()
    }
    setExcluindo(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Topo Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            Metas e Objetivos Financeiros
          </h1>
          <p className="text-sm text-texto-apoio mt-1">
            Planeje suas conquistas, acompanhe o progresso em tempo real e cultive sua independência
            financeira.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Botao variant="ghost" size="sm" onClick={carregarDados} disabled={carregando}>
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
          </Botao>
          <Botao onClick={abrirModalNovo} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Nova Meta</span>
          </Botao>
        </div>
      </div>

      {/* Cards de Métricas Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-verde-menta bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Total de Metas
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-verde-floresta">
                {totalMetas}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-verde-menta text-verde-floresta flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-verde-menta bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Metas Ativas
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-dourado">
                {metasAtivas}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-dourado/10 text-dourado flex items-center justify-center">
              <PlayCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-verde-menta bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Metas Concluídas
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-[#2E8B57]">
                {metasConcluidas}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#2E8B57]/10 text-[#2E8B57] flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-verde-menta bg-gradient-to-br from-white to-verde-menta/30 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Total Acumulado
              </span>
              <span className="font-display text-xl font-bold tabular-nums text-[#2E8B57]">
                {formatarMoeda(totalPoupado)}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-verde-menta text-verde-floresta flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-dourado" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Status */}
      <div className="flex items-center gap-2 border-b border-verde-menta/60 pb-3">
        {(
          [
            { id: 'todas', label: 'Todas as Metas' },
            { id: 'ativa', label: 'Ativas' },
            { id: 'concluida', label: 'Concluídas' },
            { id: 'pausada', label: 'Pausadas' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFiltroStatus(tab.id as StatusMeta | 'todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroStatus === tab.id
                ? 'bg-verde-floresta text-white shadow-sm'
                : 'bg-white text-texto-apoio border border-verde-menta hover:bg-verde-menta/40 hover:text-texto-principal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de Metas */}
      {carregando ? (
        <div className="py-16 text-center text-texto-apoio space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-verde-floresta border-t-transparent mx-auto" />
          <p className="text-sm">Carregando suas metas...</p>
        </div>
      ) : metasFiltradas.length === 0 ? (
        <Card className="border-dashed border-2 border-verde-menta bg-white p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-verde-menta text-verde-floresta flex items-center justify-center mx-auto shadow-sm">
              <Target className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-verde-floresta">
                Nenhuma meta ainda. Que tal definir seu primeiro objetivo financeiro?
              </h2>
              <p className="text-xs text-texto-apoio leading-relaxed">
                Ter metas claras é o primeiro passo para cultivar uma vida financeira próspera e
                tranquila.
              </p>
            </div>
            <Botao onClick={abrirModalNovo} className="mx-auto gap-2">
              <Plus className="h-4 w-4" />
              <span>Nova Meta</span>
            </Botao>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metasFiltradas.map((meta) => {
            const valorAtualNum = Number(meta.valor_atual || 0)
            const valorObjNum = Number(meta.valor_objetivo || 1)
            const percentual = Math.min(
              100,
              Math.max(0, Math.round((valorAtualNum / valorObjNum) * 100)),
            )
            const progressoConfig = getCorProgressoMeta(percentual, meta.status)

            const isConcluida = meta.status === 'concluida' || percentual >= 100
            const isPausada = meta.status === 'pausada'

            return (
              <Card
                key={meta.id}
                className="border-verde-menta bg-white hover:border-verde-sage/60 transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display font-bold text-base text-texto-principal truncate">
                          {meta.nome}
                        </h2>
                      </div>
                      {meta.data_limite && (
                        <p className="text-[11px] text-texto-apoio flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-texto-apoio" />
                          <span>Limite: {meta.data_limite.split('-').reverse().join('/')}</span>
                        </p>
                      )}
                    </div>

                    {/* Badge de Status e Ações */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${progressoConfig.bgBadge} ${progressoConfig.textBadge} ${progressoConfig.borderBadge}`}
                      >
                        {isConcluida ? 'Concluída' : isPausada ? 'Pausada' : 'Ativa'}
                      </span>

                      <button
                        onClick={() => abrirModalEditar(meta)}
                        className="p-1 rounded-lg text-texto-apoio hover:bg-verde-menta hover:text-verde-floresta transition-colors"
                        title="Editar meta"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setMetaParaExcluir(meta)
                          setModalExcluirAberto(true)
                        }}
                        className="p-1 rounded-lg text-texto-apoio hover:bg-vermelho-suave/10 hover:text-vermelho-suave transition-colors"
                        title="Excluir meta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Valores e Percentual */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-baseline justify-between">
                      <div className="text-xs text-texto-apoio">
                        <span className="font-semibold text-sm text-texto-principal tabular-nums">
                          {formatarMoeda(valorAtualNum)}
                        </span>{' '}
                        / {formatarMoeda(valorObjNum)}
                      </div>
                      <span
                        className="font-display font-bold text-base tabular-nums"
                        style={{ color: progressoConfig.cor }}
                      >
                        {percentual}%
                      </span>
                    </div>

                    {/* Barra de Progresso Visual com cores do Design System */}
                    <div
                      className="w-full h-3 rounded-full bg-creme overflow-hidden border border-verde-menta/60"
                      role="progressbar"
                      aria-valuenow={percentual}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentual}%`,
                          backgroundColor: progressoConfig.cor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rodapé do Card com feedback */}
                  <div className="pt-2 border-t border-verde-menta/50 flex items-center justify-between text-[11px] text-texto-apoio">
                    <span>
                      {isConcluida ? (
                        <span className="text-[#2E8B57] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 inline" /> Parabéns, meta atingida!
                        </span>
                      ) : (
                        <span>
                          Faltam{' '}
                          <strong className="text-texto-principal tabular-nums font-semibold">
                            {formatarMoeda(Math.max(0, valorObjNum - valorAtualNum))}
                          </strong>
                        </span>
                      )}
                    </span>

                    <button
                      onClick={() => abrirModalEditar(meta)}
                      className="text-verde-floresta hover:underline font-semibold text-[11px]"
                    >
                      Atualizar valor
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CRIAR / EDITAR META                                */}
      {/* ======================================================== */}
      <Modal
        aberto={modalFormAberto}
        aoFechar={() => !salvando && setModalFormAberto(false)}
        titulo={metaEmEdicao ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
        descricao="Defina o objetivo, valor alvo e data limite para acompanhar seu progresso."
        tamanho="md"
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          {erroForm && (
            <div className="p-3 rounded-xl bg-vermelho-suave/10 border border-vermelho-suave/30 text-vermelho-suave text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          <div>
            <label
              htmlFor={nomeFormId}
              className="block text-xs font-semibold text-texto-principal mb-1.5"
            >
              Nome do Objetivo / Meta *
            </label>
            <input
              id={nomeFormId}
              type="text"
              required
              placeholder="Ex: Reserva de Emergência 6 Meses, Viagem de Férias, Carro Novo"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={objetivoFormId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Valor Alvo / Objetivo (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-texto-apoio">
                  R$
                </span>
                <input
                  id={objetivoFormId}
                  type="text"
                  required
                  placeholder="10.000,00"
                  value={formValorObjetivo}
                  onChange={(e) => setFormValorObjetivo(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm font-semibold tabular-nums text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={atualFormId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Valor Atual Acumulado (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-texto-apoio">
                  R$
                </span>
                <input
                  id={atualFormId}
                  type="text"
                  placeholder="0,00"
                  value={formValorAtual}
                  onChange={(e) => setFormValorAtual(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm font-semibold tabular-nums text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={dataLimiteFormId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Data Limite (Opcional)
              </label>
              <input
                id={dataLimiteFormId}
                type="date"
                value={formDataLimite}
                onChange={(e) => setFormDataLimite(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor={statusFormId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Status da Meta *
              </label>
              <select
                id={statusFormId}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as StatusMeta)}
                className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
              >
                <option value="ativa">Ativa (Em andamento)</option>
                <option value="pausada">Pausada</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-verde-menta">
            <Botao
              type="button"
              variant="ghost"
              onClick={() => setModalFormAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Botao>
            <Botao type="submit" carregando={salvando}>
              {metaEmEdicao ? 'Salvar Alterações' : 'Criar Meta'}
            </Botao>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL EXCLUSÃO DE META                                   */}
      {/* ======================================================== */}
      <Modal
        aberto={modalExcluirAberto}
        aoFechar={() => !excluindo && setModalExcluirAberto(false)}
        titulo="Excluir Meta Financeira"
        descricao={`Tem certeza que deseja excluir a meta "${metaParaExcluir?.nome}"?`}
        tamanho="sm"
        rodape={
          <>
            <Botao
              variant="ghost"
              onClick={() => setModalExcluirAberto(false)}
              disabled={excluindo}
            >
              Cancelar
            </Botao>
            <Botao variant="danger" onClick={handleConfirmarExcluir} carregando={excluindo}>
              Excluir Meta
            </Botao>
          </>
        }
      >
        <p className="text-xs text-texto-apoio leading-relaxed">
          Esta operação removerá permanentemente a meta do seu planejamento.
        </p>
      </Modal>
    </div>
  )
}

export default MetasPage
