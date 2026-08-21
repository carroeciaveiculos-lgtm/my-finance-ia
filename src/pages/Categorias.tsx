import React, { useState, useEffect, useId } from 'react'
import { categoriasService } from '@/services/categorias'
import type { Categoria, TipoLancamento } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Lock,
} from 'lucide-react'

export const CategoriasSection: React.FC = () => {
  const { toast } = useToast()
  const [categoriasArvore, setCategoriasArvore] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'despesa' | 'receita'>('todas')
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  // Modais
  const [modalCriarEditarAberto, setModalCriarEditarAberto] = useState(false)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<Categoria | null>(null)
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null)
  const [totalLancamentosUsando, setTotalLancamentosUsando] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Form states
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoLancamento>('despesa')
  const [categoriaPaiId, setCategoriaPaiId] = useState<string>('')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const nomeId = useId()
  const tipoId = useId()
  const categoriaPaiSelectId = useId()

  const carregarCategorias = async () => {
    setCarregando(true)
    const { data, error } = await categoriasService.listarArvore()
    if (error) {
      toast({
        title: 'Erro ao carregar categorias',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      const lista = data || []
      setCategoriasArvore(lista)
      // Expande todos por padrão
      const map: Record<string, boolean> = {}
      lista.forEach((c) => {
        map[c.id] = true
      })
      setExpandedNodes(map)
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarCategorias()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const abrirModalNovaPrincipal = () => {
    setCategoriaEmEdicao(null)
    setNome('')
    setTipo('despesa')
    setCategoriaPaiId('')
    setErroForm(null)
    setModalCriarEditarAberto(true)
  }

  const abrirModalNovaSubcategoria = (pai: Categoria) => {
    setCategoriaEmEdicao(null)
    setNome('')
    setTipo(pai.tipo)
    setCategoriaPaiId(pai.id)
    setErroForm(null)
    setModalCriarEditarAberto(true)
  }

  const abrirModalEditar = (cat: Categoria) => {
    setCategoriaEmEdicao(cat)
    setNome(cat.nome)
    setTipo(cat.tipo)
    setCategoriaPaiId(cat.categoria_pai_id || '')
    setErroForm(null)
    setModalCriarEditarAberto(true)
  }

  const abrirModalExcluir = async (cat: Categoria) => {
    setCategoriaParaExcluir(cat)
    const total = await categoriasService.contarLancamentosUsando(cat.id)
    setTotalLancamentosUsando(total)
    setModalExcluirAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErroForm('Por favor, informe o nome da categoria.')
      return
    }

    setSalvando(true)
    setErroForm(null)

    if (categoriaEmEdicao) {
      const { error } = await categoriasService.atualizar(categoriaEmEdicao.id, {
        nome: nome.trim(),
        tipo: tipo as 'receita' | 'despesa',
        categoria_pai_id: categoriaPaiId || null,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Categoria atualizada com sucesso!' })
        setModalCriarEditarAberto(false)
        carregarCategorias()
      }
    } else {
      const { error } = await categoriasService.criar({
        nome: nome.trim(),
        tipo: tipo as 'receita' | 'despesa',
        categoria_pai_id: categoriaPaiId || null,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Categoria criada com sucesso!' })
        setModalCriarEditarAberto(false)
        carregarCategorias()
      }
    }
    setSalvando(false)
  }

  const handleConfirmarExcluir = async () => {
    if (!categoriaParaExcluir) return
    setExcluindo(true)
    const { error } = await categoriasService.excluir(categoriaParaExcluir.id)
    if (error) {
      toast({
        title: 'Não foi possível excluir a categoria',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Categoria excluída com sucesso!' })
      setModalExcluirAberto(false)
      setCategoriaParaExcluir(null)
      carregarCategorias()
    }
    setExcluindo(false)
  }

  const categoriasFiltradas = categoriasArvore.filter((c) => {
    if (filtroTipo === 'todas') return true
    return c.tipo === filtroTipo
  })

  // Lista de categorias principais elegíveis como "Pai"
  const categoriasPrincipaisElegiveis = categoriasArvore.filter(
    (c) => (!categoriaEmEdicao || c.id !== categoriaEmEdicao.id) && c.tipo === tipo,
  )

  const totalPrincipais = categoriasArvore.length
  const totalSubcategorias = categoriasArvore.reduce(
    (acc, c) => acc + (c.subcategorias?.length || 0),
    0,
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Topo / Filtros / Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-verde-floresta">
            Estrutura de Categorias & Subcategorias
          </h2>
          <p className="text-xs text-texto-apoio mt-0.5">
            Organize suas receitas e despesas hierarquicamente para relatórios e auto-categorização
            precisa.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white rounded-xl border border-verde-menta p-1 text-xs">
            <button
              type="button"
              onClick={() => setFiltroTipo('todas')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filtroTipo === 'todas'
                  ? 'bg-verde-floresta text-white font-semibold'
                  : 'text-texto-apoio hover:text-texto-principal'
              }`}
            >
              Todas ({totalPrincipais})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('despesa')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filtroTipo === 'despesa'
                  ? 'bg-vermelho-suave text-white font-semibold'
                  : 'text-texto-apoio hover:text-texto-principal'
              }`}
            >
              Despesas
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('receita')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filtroTipo === 'receita'
                  ? 'bg-verde-sucesso text-white font-semibold'
                  : 'text-texto-apoio hover:text-texto-principal'
              }`}
            >
              Receitas
            </button>
          </div>

          <Botao variant="menta" size="sm" onClick={carregarCategorias} disabled={carregando}>
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
          </Botao>

          <Botao onClick={abrirModalNovaPrincipal} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Nova Categoria</span>
          </Botao>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-medium text-texto-apoio block">
            Categorias Principais
          </span>
          <span className="text-xl font-bold font-display text-verde-floresta">
            {totalPrincipais}
          </span>
        </Card>
        <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-medium text-texto-apoio block">Subcategorias</span>
          <span className="text-xl font-bold font-display text-verde-floresta">
            {totalSubcategorias}
          </span>
        </Card>
        <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-medium text-texto-apoio block">
            Despesas (Principais)
          </span>
          <span className="text-xl font-bold font-display text-vermelho-suave">
            {categoriasArvore.filter((c) => c.tipo === 'despesa').length}
          </span>
        </Card>
        <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-medium text-texto-apoio block">
            Receitas (Principais)
          </span>
          <span className="text-xl font-bold font-display text-verde-sucesso">
            {categoriasArvore.filter((c) => c.tipo === 'receita').length}
          </span>
        </Card>
      </div>

      {/* Árvore de Categorias */}
      {carregando ? (
        <div className="py-12 text-center text-texto-apoio space-y-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-verde-floresta border-t-transparent mx-auto" />
          <p className="text-xs">Carregando árvore de categorias...</p>
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <Card className="border-dashed border-2 border-verde-menta bg-white p-10 text-center">
          <FolderTree className="h-10 w-10 text-verde-sage mx-auto mb-2" />
          <p className="text-sm font-semibold text-verde-floresta">Nenhuma categoria encontrada</p>
          <p className="text-xs text-texto-apoio mt-1">Crie sua primeira categoria para começar.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {categoriasFiltradas.map((pai) => {
            const isDespesa = pai.tipo === 'despesa'
            const isExpanded = !!expandedNodes[pai.id]
            const subs = pai.subcategorias || []
            const isSistema = pai.user_id === null

            return (
              <Card
                key={pai.id}
                className="border-verde-menta bg-white shadow-sm overflow-hidden transition-all duration-150"
              >
                {/* Linha da Categoria Principal */}
                <div className="p-3.5 px-4 flex items-center justify-between gap-3 bg-creme/20 hover:bg-verde-menta/10 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(pai.id)}
                      className="p-1 rounded-md text-texto-apoio hover:bg-verde-menta/50 transition-colors"
                      aria-label="Expandir/recolher"
                    >
                      {subs.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-verde-floresta" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-texto-apoio" />
                        )
                      ) : (
                        <span className="inline-block w-4" />
                      )}
                    </button>

                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                        isDespesa ? 'bg-vermelho-suave' : 'bg-verde-sucesso'
                      }`}
                    >
                      {isDespesa ? (
                        <TrendingDown className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-texto-principal truncate">
                          {pai.nome}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                            isDespesa
                              ? 'bg-vermelho-suave/10 text-vermelho-suave'
                              : 'bg-verde-sucesso/10 text-verde-sucesso'
                          }`}
                        >
                          {isDespesa ? 'Despesa' : 'Receita'}
                        </span>
                        {isSistema && (
                          <span
                            className="text-[10px] font-medium text-texto-apoio bg-creme px-1.5 py-0.2 rounded border border-verde-menta inline-flex items-center gap-1"
                            title="Padrão do Sistema"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            Padrão
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-texto-apoio block">
                        {subs.length} {subs.length === 1 ? 'subcategoria' : 'subcategorias'}
                      </span>
                    </div>
                  </div>

                  {/* Ações da Principal */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => abrirModalNovaSubcategoria(pai)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-verde-menta text-verde-floresta hover:bg-verde-sage/40 transition-colors flex items-center gap-1"
                      title="Adicionar subcategoria"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">+ Subcategoria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirModalEditar(pai)}
                      className="p-1.5 rounded-lg text-texto-apoio hover:bg-verde-menta hover:text-verde-floresta transition-colors"
                      title="Editar categoria"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirModalExcluir(pai)}
                      className="p-1.5 rounded-lg text-texto-apoio hover:bg-vermelho-suave/10 hover:text-vermelho-suave transition-colors"
                      title="Excluir categoria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategorias Aninhadas */}
                {isExpanded && subs.length > 0 && (
                  <div className="border-t border-verde-menta/40 bg-white divide-y divide-verde-menta/30 pl-8 pr-4">
                    {subs.map((sub) => {
                      const isSubSistema = sub.user_id === null

                      return (
                        <div
                          key={sub.id}
                          className="py-2.5 flex items-center justify-between gap-3 hover:bg-verde-menta/10 transition-colors pr-1"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-verde-sage font-bold">└</span>
                            <span className="text-xs font-medium text-texto-principal truncate">
                              {sub.nome}
                            </span>
                            {isSubSistema && (
                              <span
                                className="text-[9px] text-texto-apoio bg-creme px-1 py-0.2 rounded border border-verde-menta inline-flex items-center gap-0.5"
                                title="Padrão do Sistema"
                              >
                                <Lock className="h-2 w-2" />
                                Padrão
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(sub)}
                              className="p-1.5 rounded-lg text-texto-apoio hover:bg-verde-menta hover:text-verde-floresta transition-colors"
                              title="Editar subcategoria"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModalExcluir(sub)}
                              className="p-1.5 rounded-lg text-texto-apoio hover:bg-vermelho-suave/10 hover:text-vermelho-suave transition-colors"
                              title="Excluir subcategoria"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CRIAR / EDITAR CATEGORIA                           */}
      {/* ======================================================== */}
      <Modal
        aberto={modalCriarEditarAberto}
        aoFechar={() => !salvando && setModalCriarEditarAberto(false)}
        titulo={
          categoriaEmEdicao
            ? `Editar ${categoriaEmEdicao.categoria_pai_id ? 'Subcategoria' : 'Categoria'}`
            : categoriaPaiId
              ? 'Nova Subcategoria'
              : 'Nova Categoria Principal'
        }
        descricao="Defina o nome, tipo e hierarquia da sua categoria financeira."
        tamanho="sm"
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
              Nome da Categoria *
            </label>
            <input
              id={nomeId}
              type="text"
              required
              placeholder="Ex: Farmácia & Remédios, Assinaturas"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={tipoId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Tipo *
              </label>
              <select
                id={tipoId}
                value={tipo}
                disabled={!!categoriaPaiId}
                onChange={(e) => {
                  setTipo(e.target.value as TipoLancamento)
                  setCategoriaPaiId('')
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage disabled:opacity-60"
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={categoriaPaiSelectId}
                className="block text-xs font-semibold text-texto-principal mb-1.5"
              >
                Categoria Pai (Opcional)
              </label>
              <select
                id={categoriaPaiSelectId}
                value={categoriaPaiId}
                onChange={(e) => setCategoriaPaiId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage"
              >
                <option value="">Nenhuma (Principal)</option>
                {categoriasPrincipaisElegiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-verde-menta">
            <Botao
              type="button"
              variant="ghost"
              onClick={() => setModalCriarEditarAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Botao>
            <Botao type="submit" carregando={salvando}>
              {categoriaEmEdicao ? 'Salvar Alterações' : 'Criar Categoria'}
            </Botao>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL EXCLUIR CATEGORIA                                  */}
      {/* ======================================================== */}
      <Modal
        aberto={modalExcluirAberto}
        aoFechar={() => !excluindo && setModalExcluirAberto(false)}
        titulo="Excluir Categoria"
        descricao={`Tem certeza que deseja excluir "${categoriaParaExcluir?.nome}"?`}
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
              Excluir Categoria
            </Botao>
          </>
        }
      >
        <div className="space-y-3 text-xs text-texto-apoio">
          {totalLancamentosUsando > 0 ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Atenção: Categoria em uso!</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Existem <strong>{totalLancamentosUsando} lançamentos</strong> vinculados a esta
                categoria. Ao excluir, esses lançamentos terão a categoria desvinculada (ficarão sem
                categoria).
              </p>
            </div>
          ) : (
            <p className="leading-relaxed">
              Esta categoria não está vinculada a nenhum lançamento no momento. A exclusão será
              permanente.
            </p>
          )}

          {categoriaParaExcluir?.user_id === null && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-vermelho-suave text-[11px]">
              🔒 Esta é uma categoria padrão do sistema.
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default CategoriasSection
