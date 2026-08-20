import React, { useState, useEffect, useId } from 'react'
import { contasService } from '@/services/contas'
import { lancamentosService } from '@/services/lancamentos'
import type { Conta, TipoConta } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  Building2,
  PiggyBank,
  CreditCard,
  Banknote,
  MoreHorizontal,
  ArrowUpDown,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

const TIPOS_CONTA: { valor: TipoConta; rotulo: string; icone: React.ElementType }[] = [
  { valor: 'conta_corrente', rotulo: 'Conta Corrente', icone: Building2 },
  { valor: 'poupanca', rotulo: 'Poupança', icone: PiggyBank },
  { valor: 'cartao_credito', rotulo: 'Cartão de Crédito', icone: CreditCard },
  { valor: 'dinheiro', rotulo: 'Dinheiro em Espécie', icone: Banknote },
  { valor: 'outro', rotulo: 'Outra / Investimento', icone: MoreHorizontal },
]

export const ContasPage: React.FC = () => {
  const { toast } = useToast()
  const [contas, setContas] = useState<Conta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalCriarEditarAberto, setModalCriarEditarAberto] = useState(false)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [contaEmEdicao, setContaEmEdicao] = useState<Conta | null>(null)
  const [contaParaExcluir, setContaParaExcluir] = useState<Conta | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Saldos calculados por conta
  const [saldosAtuais, setSaldosAtuais] = useState<Record<string, number>>({})

  // Form states
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoConta>('conta_corrente')
  const [banco, setBanco] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('0,00')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const nomeId = useId()
  const tipoId = useId()
  const bancoId = useId()
  const saldoInicialId = useId()

  const carregarDados = async () => {
    setCarregando(true)
    const [resContas, resLancamentos] = await Promise.all([
      contasService.listar(),
      lancamentosService.listar(),
    ])

    if (resContas.error) {
      toast({
        title: 'Erro ao carregar contas',
        description: resContas.error.message,
        variant: 'destructive',
      })
    } else {
      const listaContas = resContas.data || []
      setContas(listaContas)

      // Calcula saldo atual por conta: saldo_inicial + receitas - despesas
      const mapaSaldos: Record<string, number> = {}
      listaContas.forEach((c) => {
        mapaSaldos[c.id] = Number(c.saldo_inicial) || 0
      })

      if (resLancamentos.data) {
        resLancamentos.data.forEach((l) => {
          if (l.conta_id && mapaSaldos[l.conta_id] !== undefined) {
            const v = Number(l.valor) || 0
            if (l.tipo === 'receita') {
              mapaSaldos[l.conta_id] += v
            } else {
              mapaSaldos[l.conta_id] -= v
            }
          }
        })
      }

      setSaldosAtuais(mapaSaldos)
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const abrirModalNovo = () => {
    setContaEmEdicao(null)
    setNome('')
    setTipo('conta_corrente')
    setBanco('')
    setSaldoInicial('0,00')
    setErroForm(null)
    setModalCriarEditarAberto(true)
  }

  const abrirModalEditar = (c: Conta) => {
    setContaEmEdicao(c)
    setNome(c.nome)
    setTipo(c.tipo)
    setBanco(c.banco || '')
    setSaldoInicial(
      (Number(c.saldo_inicial) || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
    setErroForm(null)
    setModalCriarEditarAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErroForm('Por favor, informe o nome da conta.')
      return
    }

    // Normaliza saldo inicial
    const saldoLimpo = saldoInicial.replace(/\./g, '').replace(',', '.')
    const saldoNum = parseFloat(saldoLimpo)
    if (isNaN(saldoNum)) {
      setErroForm('Valor do saldo inicial inválido.')
      return
    }

    setSalvando(true)
    setErroForm(null)

    if (contaEmEdicao) {
      const { error } = await contasService.atualizar(contaEmEdicao.id, {
        nome: nome.trim(),
        tipo,
        banco: banco.trim() || null,
        saldo_inicial: saldoNum,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Conta atualizada com sucesso!' })
        setModalCriarEditarAberto(false)
        carregarDados()
      }
    } else {
      const { error } = await contasService.criar({
        nome: nome.trim(),
        tipo,
        banco: banco.trim() || null,
        saldo_inicial: saldoNum,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Conta criada com sucesso!' })
        setModalCriarEditarAberto(false)
        carregarDados()
      }
    }
    setSalvando(false)
  }

  const handleConfirmarExcluir = async () => {
    if (!contaParaExcluir) return
    setExcluindo(true)
    const { error } = await contasService.excluir(contaParaExcluir.id)
    if (error) {
      toast({
        title: 'Não foi possível excluir a conta',
        description: error.message.includes('foreign key')
          ? 'Esta conta possui lançamentos vinculados. Exclua ou mova os lançamentos antes.'
          : error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Conta excluída com sucesso' })
      setModalExcluirAberto(false)
      setContaParaExcluir(null)
      carregarDados()
    }
    setExcluindo(false)
  }

  const saldoGeralConsolidado = Object.values(saldosAtuais).reduce((acc, curr) => acc + curr, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            Gestão de Contas & Carteiras
          </h1>
          <p className="text-sm text-texto-apoio mt-1">
            Cadastre suas contas bancárias, cartões, carteiras físicas e acompanhe seus saldos
            consolidados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Botao variant="menta" size="sm" onClick={carregarDados} disabled={carregando}>
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Botao>
          <Botao onClick={abrirModalNovo} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Nova Conta</span>
          </Botao>
        </div>
      </div>

      {/* Card Resumo de Saldo Consolidado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-verde-menta bg-gradient-to-br from-white to-verde-menta/30 shadow-sm md:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-texto-apoio flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Saldo Total Consolidado</span>
              <DollarSign className="h-4 w-4 text-verde-floresta" />
            </CardDescription>
            <CardTitle className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-verde-floresta">
              {saldoGeralConsolidado.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-texto-apoio">
            Soma de {contas.length}{' '}
            {contas.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}
          </CardContent>
        </Card>

        <Card className="border-verde-menta bg-white shadow-sm md:col-span-2 flex flex-col justify-center">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-verde-menta flex items-center justify-center text-verde-floresta shrink-0">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-verde-floresta">
                Organização por Carteiras
              </h2>
              <p className="text-xs text-texto-apoio mt-0.5">
                Mantenha suas contas atualizadas para ter uma visão precisa do fluxo de caixa e
                facilitar a conciliação de extratos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Cards de Contas */}
      {carregando ? (
        <div className="py-16 text-center text-texto-apoio space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-verde-floresta border-t-transparent mx-auto" />
          <p className="text-sm">Carregando suas contas...</p>
        </div>
      ) : contas.length === 0 ? (
        <Card className="border-dashed border-2 border-verde-menta bg-white p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-verde-menta text-verde-floresta flex items-center justify-center mx-auto shadow-sm">
              <Wallet className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-verde-floresta">
                Nenhuma conta cadastrada ainda
              </h2>
              <p className="text-xs text-texto-apoio leading-relaxed">
                Comece criando sua primeira conta corrente, carteira ou cartão para registrar seus
                lançamentos e importar extratos bancários.
              </p>
            </div>
            <Botao onClick={abrirModalNovo} className="mx-auto">
              <Plus className="h-4 w-4" />
              <span>Cadastrar Minha Primeira Conta</span>
            </Botao>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contas.map((conta) => {
            const configTipo = TIPOS_CONTA.find((t) => t.valor === conta.tipo) || TIPOS_CONTA[0]
            const IconeTipo = configTipo.icone
            const saldoAtual = saldosAtuais[conta.id] ?? Number(conta.saldo_inicial)

            return (
              <Card
                key={conta.id}
                className="border-verde-menta bg-white hover:border-verde-sage/60 transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-verde-menta text-verde-floresta flex items-center justify-center shrink-0 shadow-sm">
                        <IconeTipo className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display font-semibold text-base text-texto-principal truncate">
                          {conta.nome}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-texto-apoio truncate">
                          <span>{configTipo.rotulo}</span>
                          {conta.banco && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-verde-floresta truncate">
                                {conta.banco}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => abrirModalEditar(conta)}
                        className="p-1.5 rounded-lg text-texto-apoio hover:bg-verde-menta hover:text-verde-floresta transition-colors"
                        title="Editar conta"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setContaParaExcluir(conta)
                          setModalExcluirAberto(true)
                        }}
                        className="p-1.5 rounded-lg text-texto-apoio hover:bg-vermelho-suave/10 hover:text-vermelho-suave transition-colors"
                        title="Excluir conta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-verde-menta/60 flex items-end justify-between">
                    <div>
                      <span className="block text-[11px] font-medium text-texto-apoio">
                        Saldo Atual
                      </span>
                      <span
                        className={`font-display text-xl font-bold tabular-nums ${
                          saldoAtual >= 0 ? 'text-verde-sucesso' : 'text-vermelho-suave'
                        }`}
                      >
                        {saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] font-medium text-texto-apoio">
                        Saldo Inicial
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-texto-apoio">
                        {(Number(conta.saldo_inicial) || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CRIAR / EDITAR CONTA                               */}
      {/* ======================================================== */}
      <Modal
        aberto={modalCriarEditarAberto}
        aoFechar={() => !salvando && setModalCriarEditarAberto(false)}
        titulo={contaEmEdicao ? 'Editar Conta' : 'Nova Conta Bancária ou Carteira'}
        descricao="Preencha os detalhes da sua conta para controle financeiro."
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
              htmlFor={nomeId}
              className="block text-xs font-semibold text-texto-principal mb-1.5"
            >
              Nome da Conta *
            </label>
            <input
              id={nomeId}
              type="text"
              required
              placeholder="Ex: Conta Principal Nubank, Carteira Física"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={tipoId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Tipo de Conta *
              </label>
              <select
                id={tipoId}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoConta)}
                className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
              >
                {TIPOS_CONTA.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={bancoId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Instituição Financeira / Banco
              </label>
              <input
                id={bancoId}
                type="text"
                placeholder="Ex: Itaú, Nubank, Bradesco"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={saldoInicialId}
              className="block text-xs font-semibold text-texto-principal mb-1.5"
            >
              Saldo Inicial (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-texto-apoio">
                R$
              </span>
              <input
                id={saldoInicialId}
                type="text"
                placeholder="0,00"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm font-semibold tabular-nums text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[11px] text-texto-apoio mt-1">
              Saldo de partida antes do registro dos novos lançamentos no My Finance IA.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-verde-menta">
            <Botao
              type="button"
              variant="ghost"
              onClick={() => setModalCriarEditarAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Botao>
            <Botao type="submit" carregando={salvando}>
              {contaEmEdicao ? 'Salvar Alterações' : 'Criar Conta'}
            </Botao>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO                            */}
      {/* ======================================================== */}
      <Modal
        aberto={modalExcluirAberto}
        aoFechar={() => !excluindo && setModalExcluirAberto(false)}
        titulo="Excluir Conta"
        descricao={`Tem certeza que deseja excluir permanentemente a conta "${contaParaExcluir?.nome}"?`}
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
              Excluir Conta
            </Botao>
          </>
        }
      >
        <p className="text-xs text-texto-apoio leading-relaxed">
          Esta ação não pode ser desfeita. Se houver lançamentos associados a esta conta, a exclusão
          será bloqueada para proteger seu histórico financeiro.
        </p>
      </Modal>
    </div>
  )
}

export default ContasPage
