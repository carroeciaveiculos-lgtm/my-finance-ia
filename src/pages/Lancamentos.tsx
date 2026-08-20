import React, { useState, useEffect, useMemo, useId } from 'react'
import { lancamentosService, type FiltrosLancamentos } from '@/services/lancamentos'
import { contasService } from '@/services/contas'
import { categoriasService } from '@/services/categorias'
import type { Lancamento, Conta, Categoria, TipoLancamento } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Calendar,
  Wallet,
  Edit2,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const LancamentosPage: React.FC = () => {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoLancamento>('todos')
  const [filtroConta, setFiltroConta] = useState<string>('todas')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroMesAno, setFiltroMesAno] = useState<string>(() => {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  })

  // Modais de Criação/Edição e Exclusão
  const [modalFormAberto, setModalFormAberto] = useState(false)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState<Lancamento | null>(null)
  const [lancamentoParaExcluir, setLancamentoParaExcluir] = useState<Lancamento | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Form State
  const [formTipo, setFormTipo] = useState<TipoLancamento>('despesa')
  const [formValor, setFormValor] = useState('')
  const [formData, setFormData] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [formDescricao, setFormDescricao] = useState('')
  const [formCategoriaId, setFormCategoriaId] = useState<string>('')
  const [formSubcategoriaId, setFormSubcategoriaId] = useState<string>('')
  const [formContaId, setFormContaId] = useState<string>('')
  const [formContaDestinoId, setFormContaDestinoId] = useState<string>('')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const tipoFormId = useId()
  const valorFormId = useId()
  const dataFormId = useId()
  const descricaoFormId = useId()
  const categoriaFormId = useId()
  const subcategoriaFormId = useId()
  const contaFormId = useId()
  const contaDestinoFormId = useId()

  const carregarDados = async () => {
    setCarregando(true)
    const [resLanc, resContas, resCats] = await Promise.all([
      lancamentosService.listar(),
      contasService.listar(),
      categoriasService.listarArvore(),
    ])

    if (resLanc.error) {
      toast({
        title: 'Erro ao carregar lançamentos',
        description: resLanc.error.message,
        variant: 'destructive',
      })
    } else {
      setLancamentos(resLanc.data || [])
    }

    if (resContas.data) setContas(resContas.data)
    if (resCats.data) setCategorias(resCats.data)

    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Categorias filtradas pelo tipo (receita / despesa) selecionado no form
  const categoriasPaiDisponiveis = useMemo(() => {
    if (formTipo === 'transferencia') return []
    return categorias.filter((c) => !c.categoria_pai_id && c.tipo === formTipo)
  }, [categorias, formTipo])

  // Subcategorias disponíveis para a categoria pai selecionada
  const subcategoriasDisponiveis = useMemo(() => {
    if (!formCategoriaId) return []
    const catPai = categorias.find((c) => c.id === formCategoriaId)
    return catPai?.subcategorias || []
  }, [categorias, formCategoriaId])

  // Quando mudar o tipo no form, reseta a categoria selecionada se ela não pertencer ao tipo
  const handleMudarTipoForm = (novoTipo: TipoLancamento) => {
    setFormTipo(novoTipo)
    if (novoTipo === 'transferencia') {
      setFormCategoriaId('')
      setFormSubcategoriaId('')
      // Define conta destino inicial se disponível
      const destinoDisponivel = contas.find((c) => c.id !== formContaId)
      if (destinoDisponivel) {
        setFormContaDestinoId(destinoDisponivel.id)
      }
    } else {
      setFormContaDestinoId('')
      setFormCategoriaId('')
      setFormSubcategoriaId('')
    }
  }

  const handleMudarCategoriaForm = (novaCatId: string) => {
    setFormCategoriaId(novaCatId)
    setFormSubcategoriaId('')
  }

  const abrirModalNovo = () => {
    setLancamentoEmEdicao(null)
    setFormTipo('despesa')
    setFormValor('')
    setFormData(new Date().toISOString().slice(0, 10))
    setFormDescricao('')
    setFormCategoriaId('')
    setFormSubcategoriaId('')
    const primeiraConta = contas.length > 0 ? contas[0].id : ''
    setFormContaId(primeiraConta)
    const segundaConta = contas.find((c) => c.id !== primeiraConta)?.id || ''
    setFormContaDestinoId(segundaConta)
    setErroForm(null)
    setModalFormAberto(true)
  }

  const abrirModalEditar = (lanc: Lancamento) => {
    setLancamentoEmEdicao(lanc)
    setFormTipo(lanc.tipo)
    setFormValor(
      Number(lanc.valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
    setFormData(lanc.data)
    setFormDescricao(lanc.descricao || '')
    setFormCategoriaId(lanc.categoria_id || '')
    setFormSubcategoriaId(lanc.subcategoria_id || '')
    setFormContaId(lanc.conta_id || '')
    setFormContaDestinoId(lanc.conta_destino_id || '')
    setErroForm(null)
    setModalFormAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValor.trim()) {
      setErroForm('Informe o valor do lançamento.')
      return
    }

    const valorLimpo = formValor.replace(/\./g, '').replace(',', '.')
    const valorNum = parseFloat(valorLimpo)
    if (isNaN(valorNum) || valorNum <= 0) {
      setErroForm('Informe um valor numérico válido maior que zero.')
      return
    }

    if (!formData) {
      setErroForm('Selecione a data do lançamento.')
      return
    }

    if (!formDescricao.trim()) {
      setErroForm('Informe a descrição do lançamento.')
      return
    }

    if (formTipo === 'transferencia') {
      if (!formContaId) {
        setErroForm('Selecione a conta de origem para a transferência.')
        return
      }
      if (!formContaDestinoId) {
        setErroForm('Selecione a conta de destino para a transferência.')
        return
      }
      if (formContaId === formContaDestinoId) {
        setErroForm('A conta de destino deve ser diferente da conta de origem.')
        return
      }
    }

    setSalvando(true)
    setErroForm(null)

    if (lancamentoEmEdicao) {
      const { error } = await lancamentosService.atualizar(lancamentoEmEdicao.id, {
        tipo: formTipo,
        valor: valorNum,
        data: formData,
        descricao: formDescricao.trim(),
        categoria_id: formTipo === 'transferencia' ? null : formCategoriaId || null,
        subcategoria_id: formTipo === 'transferencia' ? null : formSubcategoriaId || null,
        conta_id: formContaId || null,
        conta_destino_id: formTipo === 'transferencia' ? formContaDestinoId || null : null,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Lançamento atualizado com sucesso!' })
        setModalFormAberto(false)
        carregarDados()
      }
    } else {
      const { error } = await lancamentosService.criar({
        tipo: formTipo,
        valor: valorNum,
        data: formData,
        descricao: formDescricao.trim(),
        categoria_id: formTipo === 'transferencia' ? null : formCategoriaId || null,
        subcategoria_id: formTipo === 'transferencia' ? null : formSubcategoriaId || null,
        conta_id: formContaId || null,
        conta_destino_id: formTipo === 'transferencia' ? formContaDestinoId || null : null,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Lançamento cadastrado com sucesso!' })
        setModalFormAberto(false)
        carregarDados()
      }
    }
    setSalvando(false)
  }

  const handleConfirmarExcluir = async () => {
    if (!lancamentoParaExcluir) return
    setExcluindo(true)
    const { error } = await lancamentosService.excluir(lancamentoParaExcluir.id)
    if (error) {
      toast({
        title: 'Erro ao excluir lançamento',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Lançamento excluído com sucesso.' })
      setModalExcluirAberto(false)
      setLancamentoParaExcluir(null)
      carregarDados()
    }
    setExcluindo(false)
  }

  // Filtragem e Ordenação
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((lanc) => {
      // Filtro mês/ano (se preenchido)
      if (filtroMesAno && !lanc.data.startsWith(filtroMesAno)) {
        return false
      }

      // Filtro tipo
      if (filtroTipo !== 'todos' && lanc.tipo !== filtroTipo) {
        return false
      }

      // Filtro conta
      if (filtroConta !== 'todas' && lanc.conta_id !== filtroConta) {
        return false
      }

      // Filtro categoria
      if (filtroCategoria !== 'todas' && lanc.categoria_id !== filtroCategoria) {
        return false
      }

      // Filtro texto busca
      if (filtroTexto.trim()) {
        const t = filtroTexto.toLowerCase()
        const descMatch = (lanc.descricao || '').toLowerCase().includes(t)
        const catMatch = (lanc.categoria?.nome || '').toLowerCase().includes(t)
        const subCatMatch = (lanc.subcategoria?.nome || '').toLowerCase().includes(t)
        const contaMatch = (lanc.conta?.nome || '').toLowerCase().includes(t)
        if (!descMatch && !catMatch && !subCatMatch && !contaMatch) {
          return false
        }
      }

      return true
    })
  }, [lancamentos, filtroMesAno, filtroTipo, filtroConta, filtroCategoria, filtroTexto])

  // Métricas do período filtrado (Transferências são excluídas de receitas e despesas)
  const totalReceitas = useMemo(() => {
    return lancamentosFiltrados
      .filter((l) => l.tipo === 'receita')
      .reduce((acc, l) => acc + Number(l.valor || 0), 0)
  }, [lancamentosFiltrados])

  const totalDespesas = useMemo(() => {
    return lancamentosFiltrados
      .filter((l) => l.tipo === 'despesa')
      .reduce((acc, l) => acc + Number(l.valor || 0), 0)
  }, [lancamentosFiltrados])

  const totalTransferencias = useMemo(() => {
    return lancamentosFiltrados
      .filter((l) => l.tipo === 'transferencia')
      .reduce((acc, l) => acc + Number(l.valor || 0), 0)
  }, [lancamentosFiltrados])

  const saldoPeriodo = totalReceitas - totalDespesas

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            Lançamentos Financeiros
          </h1>
          <p className="text-sm text-texto-apoio mt-1">
            Controle detalhado de entradas e saídas com categorização precisa e números tabulares.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Botao
            variant="menta"
            size="sm"
            onClick={() => navigate('/importacao')}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Importar Extrato</span>
          </Botao>
          <Botao variant="ghost" size="sm" onClick={carregarDados} disabled={carregando}>
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
          </Botao>
          <Botao onClick={abrirModalNovo} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Novo Lançamento</span>
          </Botao>
        </div>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-verde-menta bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Total Receitas
              </span>
              <span className="font-display text-xl font-bold tabular-nums text-verde-sucesso">
                {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-verde-sucesso/10 text-verde-sucesso flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-verde-menta bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Total Despesas
              </span>
              <span className="font-display text-xl font-bold tabular-nums text-vermelho-suave">
                {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-vermelho-suave/10 text-vermelho-suave flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-verde-menta bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Transferências
              </span>
              <span className="font-display text-xl font-bold tabular-nums text-dourado">
                {totalTransferencias.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-dourado/10 text-dourado flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-verde-menta bg-gradient-to-br from-white to-verde-menta/30 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-texto-apoio uppercase tracking-wider block">
                Saldo do Período
              </span>
              <span
                className={`font-display text-xl font-bold tabular-nums ${
                  saldoPeriodo >= 0 ? 'text-verde-sucesso' : 'text-vermelho-suave'
                }`}
              >
                {saldoPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-verde-menta text-verde-floresta flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card className="border-verde-menta bg-white shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Busca por texto */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-apoio" />
            <input
              type="text"
              placeholder="Buscar descrição..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-verde-menta bg-creme/40 text-xs text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:bg-white"
            />
          </div>

          {/* Mês / Ano */}
          <div>
            <input
              type="month"
              value={filtroMesAno}
              onChange={(e) => setFiltroMesAno(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-verde-menta bg-creme/40 text-xs text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:bg-white"
            />
          </div>

          {/* Tipo */}
          <div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | TipoLancamento)}
              className="w-full px-3 py-2 rounded-xl border border-verde-menta bg-creme/40 text-xs text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:bg-white"
            >
              <option value="todos">Todos os tipos</option>
              <option value="receita">Receitas (+)</option>
              <option value="despesa">Despesas (-)</option>
              <option value="transferencia">Transferências (⇄)</option>
            </select>
          </div>

          {/* Conta */}
          <div>
            <select
              value={filtroConta}
              onChange={(e) => setFiltroConta(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-verde-menta bg-creme/40 text-xs text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:bg-white"
            >
              <option value="todas">Todas as contas</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-verde-menta bg-creme/40 text-xs text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:bg-white"
            >
              <option value="todas">Todas as categorias</option>
              {categorias
                .filter((c) => !c.categoria_pai_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.tipo === 'receita' ? 'Receita' : 'Despesa'})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabela de Lançamentos */}
      <Card className="border-verde-menta bg-white shadow-sm overflow-hidden">
        {carregando ? (
          <div className="py-16 text-center text-texto-apoio space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-verde-floresta border-t-transparent mx-auto" />
            <p className="text-sm">Carregando lançamentos...</p>
          </div>
        ) : lancamentosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-verde-menta text-verde-floresta flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <h2 className="font-display font-semibold text-base text-texto-principal">
              Nenhum lançamento encontrado
            </h2>
            <p className="text-xs text-texto-apoio max-w-sm mx-auto">
              {lancamentos.length === 0
                ? 'Comece adicionando seu primeiro lançamento ou importe um extrato bancário.'
                : 'Nenhum lançamento corresponde aos filtros selecionados. Tente ajustar os filtros.'}
            </p>
            {lancamentos.length === 0 && (
              <Botao onClick={abrirModalNovo} size="sm" className="mt-2">
                <Plus className="h-4 w-4" />
                <span>Adicionar Lançamento</span>
              </Botao>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-creme/60 border-b border-verde-menta text-texto-apoio font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria / Subcategoria</th>
                  <th className="py-3 px-4">Conta</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-verde-menta/50">
                {lancamentosFiltrados.map((lanc) => {
                  const isReceita = lanc.tipo === 'receita'
                  const isTransferencia = lanc.tipo === 'transferencia'
                  const valorNum = Number(lanc.valor)

                  return (
                    <tr key={lanc.id} className="hover:bg-verde-menta/20 transition-colors group">
                      {/* Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-texto-principal tabular-nums font-medium">
                        {lanc.data.split('-').reverse().join('/')}
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4 font-semibold text-texto-principal">
                        <div className="flex items-center gap-2">
                          {isReceita ? (
                            <ArrowUpCircle className="h-4 w-4 text-verde-sucesso shrink-0" />
                          ) : isTransferencia ? (
                            <ArrowRightLeft className="h-4 w-4 text-dourado shrink-0" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-vermelho-suave shrink-0" />
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="truncate max-w-xs">
                              {lanc.descricao || 'Sem descrição'}
                            </span>
                            {isTransferencia && (
                              <span className="text-[10px] font-semibold bg-dourado/15 text-dourado px-2 py-0.5 rounded-md border border-dourado/30">
                                Transferência
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isTransferencia ? (
                          <span className="text-[11px] font-medium text-texto-apoio">
                            Transferência interna
                          </span>
                        ) : lanc.categoria ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-texto-principal">
                              {lanc.categoria.nome}
                            </span>
                            {lanc.subcategoria && (
                              <span className="text-[10px] text-texto-apoio">
                                {lanc.subcategoria.nome}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] italic text-texto-apoio/70">
                            Sem categoria
                          </span>
                        )}
                      </td>

                      {/* Conta */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-texto-apoio">
                        {isTransferencia ? (
                          <div className="flex items-center gap-1.5 text-texto-principal font-medium">
                            <span>{lanc.conta?.nome || 'Origem'}</span>
                            <ArrowRightLeft className="h-3 w-3 text-dourado shrink-0" />
                            <span className="text-verde-floresta">
                              {lanc.conta_destino?.nome || 'Destino'}
                            </span>
                          </div>
                        ) : (
                          lanc.conta?.nome || '—'
                        )}
                      </td>

                      {/* Valor */}
                      <td
                        className={`py-3.5 px-4 text-right font-display font-bold tabular-nums whitespace-nowrap text-sm ${
                          isReceita
                            ? 'text-verde-sucesso'
                            : isTransferencia
                              ? 'text-dourado'
                              : 'text-vermelho-suave'
                        }`}
                      >
                        {isReceita ? '+ ' : isTransferencia ? '⇄ ' : '- '}
                        {valorNum.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => abrirModalEditar(lanc)}
                            className="p-1 rounded text-texto-apoio hover:bg-verde-menta hover:text-verde-floresta transition-colors"
                            title="Editar lançamento"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setLancamentoParaExcluir(lanc)
                              setModalExcluirAberto(true)
                            }}
                            className="p-1 rounded text-texto-apoio hover:bg-vermelho-suave/10 hover:text-vermelho-suave transition-colors"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* MODAL CRIAR / EDITAR LANÇAMENTO                          */}
      {/* ======================================================== */}
      <Modal
        aberto={modalFormAberto}
        aoFechar={() => !salvando && setModalFormAberto(false)}
        titulo={lancamentoEmEdicao ? 'Editar Lançamento' : 'Novo Lançamento'}
        descricao="Preencha os campos para registrar uma receita ou despesa."
        tamanho="md"
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          {erroForm && (
            <div className="p-3 rounded-xl bg-vermelho-suave/10 border border-vermelho-suave/30 text-vermelho-suave text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          {/* Toggle Receita / Despesa / Transferencia */}
          <div>
            <label
              htmlFor={tipoFormId}
              className="block text-xs font-semibold text-texto-principal mb-1.5"
            >
              Tipo de Movimentação
            </label>
            <div
              id={tipoFormId}
              className="grid grid-cols-3 gap-1.5 p-1 bg-creme rounded-xl border border-verde-menta"
            >
              <button
                type="button"
                onClick={() => handleMudarTipoForm('despesa')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  formTipo === 'despesa'
                    ? 'bg-vermelho-suave text-white shadow-sm'
                    : 'text-texto-apoio hover:text-texto-principal'
                }`}
              >
                <ArrowDownCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Despesa</span>
              </button>

              <button
                type="button"
                onClick={() => handleMudarTipoForm('receita')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  formTipo === 'receita'
                    ? 'bg-verde-sucesso text-white shadow-sm'
                    : 'text-texto-apoio hover:text-texto-principal'
                }`}
              >
                <ArrowUpCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Receita</span>
              </button>

              <button
                type="button"
                onClick={() => handleMudarTipoForm('transferencia')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  formTipo === 'transferencia'
                    ? 'bg-dourado text-white shadow-sm'
                    : 'text-texto-apoio hover:text-texto-principal'
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Transferência</span>
              </button>
            </div>
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={valorFormId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-texto-apoio">
                  R$
                </span>
                <input
                  id={valorFormId}
                  type="text"
                  required
                  placeholder="0,00"
                  value={formValor}
                  onChange={(e) => setFormValor(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm font-semibold tabular-nums text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={dataFormId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Data do Lançamento *
              </label>
              <input
                id={dataFormId}
                type="date"
                required
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label
              htmlFor={descricaoFormId}
              className="block text-xs font-semibold text-texto-principal mb-1.5"
            >
              Descrição / Histórico *
            </label>
            <input
              id={descricaoFormId}
              type="text"
              required
              placeholder="Ex: Supermercado Pão de Açúcar, Salário Mensal"
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
            />
          </div>

          {/* Contas Origem e Destino / Categorias */}
          {formTipo === 'transferencia' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={contaFormId}
                  className="block text-xs font-semibold text-texto-principal mb-1.5"
                >
                  Conta Origem (Sai Dinheiro) *
                </label>
                <select
                  id={contaFormId}
                  required
                  value={formContaId}
                  onChange={(e) => setFormContaId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                >
                  <option value="">Selecione a conta de origem</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.banco ? `(${c.banco})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={contaDestinoFormId}
                  className="block text-xs font-semibold text-texto-principal mb-1.5"
                >
                  Conta Destino (Entra / Fatura) *
                </label>
                <select
                  id={contaDestinoFormId}
                  required
                  value={formContaDestinoId}
                  onChange={(e) => setFormContaDestinoId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                >
                  <option value="">Selecione a conta de destino</option>
                  {contas
                    .filter((c) => c.id !== formContaId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.banco ? `(${c.banco})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Conta */}
              <div>
                <label
                  htmlFor={contaFormId}
                  className="block text-xs font-semibold text-texto-principal mb-1.5"
                >
                  Conta Bancária / Carteira
                </label>
                <select
                  id={contaFormId}
                  value={formContaId}
                  onChange={(e) => setFormContaId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                >
                  <option value="">Selecione uma conta (opcional)</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.banco ? `(${c.banco})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria e Subcategoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={categoriaFormId}
                    className="block text-xs font-semibold text-texto-principal mb-1.5"
                  >
                    Categoria Principal
                  </label>
                  <select
                    id={categoriaFormId}
                    value={formCategoriaId}
                    onChange={(e) => handleMudarCategoriaForm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                  >
                    <option value="">Selecione a categoria</option>
                    {categoriasPaiDisponiveis.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={subcategoriaFormId}
                    className="block text-xs font-semibold text-texto-principal mb-1.5"
                  >
                    Subcategoria
                  </label>
                  <select
                    id={subcategoriaFormId}
                    value={formSubcategoriaId}
                    disabled={!formCategoriaId || subcategoriasDisponiveis.length === 0}
                    onChange={(e) => setFormSubcategoriaId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal disabled:opacity-50 disabled:bg-creme focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all"
                  >
                    <option value="">
                      {!formCategoriaId
                        ? 'Selecione a categoria primeiro'
                        : subcategoriasDisponiveis.length === 0
                          ? 'Sem subcategorias cadastradas'
                          : 'Selecione a subcategoria (opcional)'}
                    </option>
                    {subcategoriasDisponiveis.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Rodapé Form */}
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
              {lancamentoEmEdicao ? 'Salvar Alterações' : 'Criar Lançamento'}
            </Botao>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL EXCLUSÃO DE LANÇAMENTO                             */}
      {/* ======================================================== */}
      <Modal
        aberto={modalExcluirAberto}
        aoFechar={() => !excluindo && setModalExcluirAberto(false)}
        titulo="Excluir Lançamento"
        descricao={`Tem certeza que deseja excluir o lançamento "${lancamentoParaExcluir?.descricao}" no valor de R$ ${Number(lancamentoParaExcluir?.valor || 0).toFixed(2)}?`}
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
              Excluir
            </Botao>
          </>
        }
      >
        <p className="text-xs text-texto-apoio leading-relaxed">
          Esta operação removerá o lançamento do seu histórico e recalculará o saldo da conta
          associada.
        </p>
      </Modal>
    </div>
  )
}

export default LancamentosPage
