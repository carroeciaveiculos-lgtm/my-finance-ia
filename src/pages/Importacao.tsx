import React, { useState, useEffect, useId, useRef } from 'react'
import { contasService } from '@/services/contas'
import { categoriasService } from '@/services/categorias'
import { documentosService } from '@/services/documentos'
import { lancamentosService } from '@/services/lancamentos'
import { processarDocumentoImportado } from '@/services/importacaoEngine'
import { formatarMoeda, formatarData } from '@/lib/utils'
import type {
  Conta,
  Categoria,
  DocumentoImportado,
  ResultadoImportacao,
  LancamentoImportadoPrevia,
} from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  File,
  Trash2,
  AlertCircle,
  FileCode,
  Layers,
} from 'lucide-react'

const EXTENSOES_PERMITIDAS = ['.ofx', '.csv', '.xlsx', '.xls', '.pdf']

interface ArquivoSelecionado {
  id: string
  file: File
  nome: string
  tamanho: number
  tipo: string
}

export const ImportacaoPage: React.FC = () => {
  const { toast } = useToast()

  // Estados principais
  const [contas, setContas] = useState<Conta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [documentos, setDocumentos] = useState<DocumentoImportado[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)

  // Seleção múltipla de arquivos
  const [arquivosSelecionados, setArquivosSelecionados] = useState<ArquivoSelecionado[]>([])
  const [contaDestinoId, setContaDestinoId] = useState<string>('')
  const [arrastando, setArrastando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement | null>(null)

  // Estado de processamento
  const [processando, setProcessando] = useState(false)
  const [progressoTexto, setProgressoTexto] = useState('')
  const [resultadosLote, setResultadosLote] = useState<ResultadoImportacao[]>([])

  // Pré-visualização e Edição
  const [emPrevia, setEmPrevia] = useState(false)
  const [previaLancamentos, setPreviaLancamentos] = useState<LancamentoImportadoPrevia[]>([])
  const [totaisPrevia, setTotaisPrevia] = useState({
    total: 0,
    receitas: 0,
    despesas: 0,
    duplicados: 0,
    valorTotal: 0,
  })

  // Salvando no banco
  const [salvando, setSalvando] = useState(false)
  const [sucessoModal, setSucessoModal] = useState(false)
  const [salvosResumo, setSalvosResumo] = useState({ total: 0, valor: 0 })

  // Modal de Exclusão de Documento
  const [modalExcluirDocAberto, setModalExcluirDocAberto] = useState(false)
  const [documentoParaExcluir, setDocumentoParaExcluir] = useState<DocumentoImportado | null>(null)
  const [totalLancamentosVinculados, setTotalLancamentosVinculados] = useState(0)
  const [tipoExclusao, setTipoExclusao] = useState<'apenas_registro' | 'documento_e_lancamentos'>(
    'apenas_registro',
  )
  const [excluindoDoc, setExcluindoDoc] = useState(false)

  // Accordion de ajuda
  const [ajudaAberta, setAjudaAberta] = useState(false)

  const contaSelectId = useId()

  // Carregar dados iniciais de forma ultra-resiliente
  const carregarTudo = async () => {
    setCarregandoDados(true)
    try {
      const [resContas, resCategorias, resDocs] = await Promise.all([
        contasService.listar().catch(() => ({ data: [], error: null })),
        categoriasService.listarArvore().catch(() => ({ data: [], error: null })),
        documentosService.listar().catch(() => ({ data: [], error: null })),
      ])

      const listaContas = resContas && resContas.data ? resContas.data : []
      setContas(listaContas)
      if (listaContas.length > 0 && !contaDestinoId) {
        setContaDestinoId(listaContas[0].id)
      }

      setCategorias(resCategorias && resCategorias.data ? resCategorias.data : [])
      setDocumentos(resDocs && resDocs.data ? resDocs.data : [])
    } catch (err: unknown) {
      console.error('Erro ao carregar dados da página de importação:', err)
      toast({
        title: 'Aviso ao carregar dados',
        description: 'Algumas informações auxiliares não puderam ser recuperadas no momento.',
        variant: 'destructive',
      })
    } finally {
      setCarregandoDados(false)
    }
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  // Utilitário para ícone de arquivo
  const getIconeArquivo = (nome: string) => {
    const ext = nome.split('.').pop()?.toLowerCase()
    if (ext === 'ofx') return <FileCode className="h-5 w-5 text-emerald-600" />
    if (ext === 'csv') return <FileSpreadsheet className="h-5 w-5 text-blue-600" />
    if (ext === 'xlsx' || ext === 'xls')
      return <FileSpreadsheet className="h-5 w-5 text-green-700" />
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-600" />
    return <File className="h-5 w-5 text-texto-apoio" />
  }

  // Tratamento de arquivos
  const validarEAdicionarArquivos = (files: FileList | File[]) => {
    const novos: ArquivoSelecionado[] = []
    const ignorados: string[] = []

    Array.from(files).forEach((f) => {
      const ext = `.${f.name.split('.').pop()?.toLowerCase()}`
      if (EXTENSOES_PERMITIDAS.includes(ext)) {
        // Evita duplicatas pelo nome e tamanho
        const jaExiste = arquivosSelecionados.some((a) => a.nome === f.name && a.tamanho === f.size)
        if (!jaExiste) {
          novos.push({
            id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
            file: f,
            nome: f.name,
            tamanho: f.size,
            tipo: ext.replace('.', '').toUpperCase(),
          })
        }
      } else {
        ignorados.push(f.name)
      }
    })

    if (ignorados.length > 0) {
      toast({
        title: 'Formato não suportado',
        description: `Arquivos ignorados: ${ignorados.join(', ')}. Use OFX, CSV, Excel ou PDF.`,
        variant: 'destructive',
      })
    }

    if (novos.length > 0) {
      setArquivosSelecionados((prev) => [...prev, ...novos])
    }
  }

  const removerArquivo = (id: string) => {
    setArquivosSelecionados((prev) => prev.filter((a) => a.id !== id))
  }

  const limparTodosArquivos = () => {
    setArquivosSelecionados([])
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastando(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastando(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastando(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validarEAdicionarArquivos(e.dataTransfer.files)
    }
  }

  // Processamento em lote de todos os arquivos selecionados
  const handleProcessarTodos = async () => {
    if (arquivosSelecionados.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione ao menos um extrato para importar.',
        variant: 'destructive',
      })
      return
    }

    if (!contaDestinoId) {
      toast({
        title: 'Selecione uma conta de destino',
        description: 'Escolha a conta onde esses lançamentos serão alocados.',
        variant: 'destructive',
      })
      return
    }

    setProcessando(true)
    const todosResultados: ResultadoImportacao[] = []
    const todosLancamentosPrevia: LancamentoImportadoPrevia[] = []

    try {
      for (let i = 0; i < arquivosSelecionados.length; i++) {
        const item = arquivosSelecionados[i]
        setProgressoTexto(
          `Processando arquivo ${i + 1} de ${arquivosSelecionados.length}: ${item.nome}...`,
        )

        const resultado = await processarDocumentoImportado(item.file, contaDestinoId)
        todosResultados.push(resultado)

        if (resultado.lancamentos && resultado.lancamentos.length > 0) {
          resultado.lancamentos.forEach((l, idx) => {
            todosLancamentosPrevia.push({
              ...l,
              id_temporario: `${item.id}-${idx}-${l.id_temporario}`,
              ignorar: l.ignorar || l.duplicado_provavel || false,
            })
          })
        }
      }

      setResultadosLote(todosResultados)

      if (todosLancamentosPrevia.length === 0) {
        toast({
          title: 'Nenhum lançamento identificado',
          description:
            'Não foi possível extrair transações dos arquivos enviados. Verifique o formato.',
          variant: 'destructive',
        })
        setProcessando(false)
        return
      }

      // Calcula totais da prévia
      atualizarTotais(todosLancamentosPrevia)
      setPreviaLancamentos(todosLancamentosPrevia)
      setEmPrevia(true)

      toast({
        title: 'Arquivos lidos com sucesso!',
        description: `${todosLancamentosPrevia.length} lançamentos identificados para conferência.`,
      })
    } catch (err: unknown) {
      console.error('Erro ao processar lote:', err)
      toast({
        title: 'Falha no processamento',
        description:
          err instanceof Error ? err.message : 'Ocorreu um erro ao interpretar um dos extratos.',
        variant: 'destructive',
      })
    } finally {
      setProcessando(false)
      setProgressoTexto('')
    }
  }

  const atualizarTotais = (lista: LancamentoImportadoPrevia[]) => {
    const ativos = lista.filter((l) => !l.ignorar)
    const receitas = ativos.filter((l) => l.tipo === 'receita').length
    const despesas = ativos.filter((l) => l.tipo === 'despesa').length
    const duplicados = lista.filter((l) => l.duplicado_provavel).length
    const valorTotal = ativos.reduce((acc, l) => {
      const val = l.tipo === 'receita' ? l.valor : -l.valor
      return acc + val
    }, 0)

    setTotaisPrevia({
      total: ativos.length,
      receitas,
      despesas,
      duplicados,
      valorTotal,
    })
  }

  // Modificações na tabela de prévia
  const toggleIgnorarLancamento = (idTemp: string) => {
    setPreviaLancamentos((prev) => {
      const atualizados = prev.map((l) => {
        if (l.id_temporario === idTemp) {
          return { ...l, ignorar: !l.ignorar }
        }
        return l
      })
      atualizarTotais(atualizados)
      return atualizados
    })
  }

  const handleAlterarCategoriaLancamento = (idTemp: string, subId: string) => {
    setPreviaLancamentos((prev) => {
      const atualizados = prev.map((l) => {
        if (l.id_temporario === idTemp) {
          // Encontra a categoria pai
          let paiId: string | null = null
          categorias.forEach((pai) => {
            if (pai.subcategorias?.some((s) => s.id === subId)) {
              paiId = pai.id
            }
          })
          return {
            ...l,
            subcategoria_id: subId || null,
            categoria_id: paiId || l.categoria_id,
          }
        }
        return l
      })
      return atualizados
    })
  }

  const handleAlterarDescricao = (idTemp: string, novaDesc: string) => {
    setPreviaLancamentos((prev) =>
      prev.map((l) => (l.id_temporario === idTemp ? { ...l, descricao: novaDesc } : l)),
    )
  }

  const handleAlterarTipo = (idTemp: string, novoTipo: 'receita' | 'despesa') => {
    setPreviaLancamentos((prev) => {
      const atualizados = prev.map((l) => {
        if (l.id_temporario === idTemp) {
          return { ...l, tipo: novoTipo }
        }
        return l
      })
      atualizarTotais(atualizados)
      return atualizados
    })
  }

  // Confirmar e Salvar Lançamentos no Banco
  const handleConfirmarImportacaoFinal = async () => {
    const lancamentosParaSalvar = previaLancamentos.filter((l) => !l.ignorar)

    if (lancamentosParaSalvar.length === 0) {
      toast({
        title: 'Nenhum lançamento selecionado',
        description: 'Todos os lançamentos estão marcados para serem ignorados.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)

    try {
      let salvosCount = 0
      let totalValor = 0

      // Salva os lançamentos vinculados aos documentos criados
      for (const item of lancamentosParaSalvar) {
        // Encontra o docId correspondente
        const docCorrespondente = resultadosLote.find((r) =>
          r.lancamentos.some(
            (original) =>
              original.data === item.data &&
              original.valor === item.valor &&
              original.descricao === item.descricao,
          ),
        )
        const documentoId =
          docCorrespondente?.documento?.id || resultadosLote[0]?.documento?.id || null

        const { error } = await lancamentosService.criar({
          conta_id: contaDestinoId,
          categoria_id: item.categoria_id || null,
          subcategoria_id: item.subcategoria_id || null,
          tipo: item.tipo,
          valor: item.valor,
          data: item.data,
          descricao: item.descricao,
          origem: 'importacao',
          documento_id: documentoId,
        })

        if (!error) {
          salvosCount++
          totalValor += item.valor
        }
      }

      setSalvosResumo({ total: salvosCount, valor: totalValor })
      setSucessoModal(true)
      setEmPrevia(false)
      setArquivosSelecionados([])
      setPreviaLancamentos([])
      carregarTudo()
    } catch (err: unknown) {
      console.error('Erro ao salvar lançamentos importados:', err)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível gravar alguns lançamentos. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // ==========================================
  // EXCLUSÃO DE DOCUMENTO DO HISTÓRICO
  // ==========================================
  const abrirModalExcluirDoc = async (doc: DocumentoImportado) => {
    setDocumentoParaExcluir(doc)
    setTipoExclusao('apenas_registro')
    const count = await documentosService.contarLancamentos(doc.id)
    setTotalLancamentosVinculados(count)
    setModalExcluirDocAberto(true)
  }

  const handleConfirmarExclusaoDoc = async () => {
    if (!documentoParaExcluir) return

    setExcluindoDoc(true)
    try {
      if (tipoExclusao === 'apenas_registro') {
        const { error } = await documentosService.excluirApenasRegistro(documentoParaExcluir.id)
        if (error) throw error
        toast({
          title: 'Histórico removido',
          description: 'O registro do documento foi excluído. Os lançamentos foram mantidos.',
        })
      } else {
        const { error } = await documentosService.excluirDocumentoELancamentos(
          documentoParaExcluir.id,
        )
        if (error) throw error
        toast({
          title: 'Documento e lançamentos excluídos',
          description: `O documento e todos os ${totalLancamentosVinculados} lançamentos vinculados foram excluídos com sucesso.`,
        })
      }

      setModalExcluirDocAberto(false)
      setDocumentoParaExcluir(null)
      carregarTudo()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir documento',
        description: err instanceof Error ? err.message : 'Falha na exclusão.',
        variant: 'destructive',
      })
    } finally {
      setExcluindoDoc(false)
    }
  }

  // Categorias disponíveis para o dropdown da tabela
  const todasSubcategorias = categorias.flatMap((c) =>
    (c.subcategorias || []).map((sub) => ({
      id: sub.id,
      nome: `${c.nome} > ${sub.nome}`,
      tipo: c.tipo,
    })),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            Importação de Extratos & Comprovantes
          </h1>
          <p className="text-sm text-texto-apoio mt-1">
            Importe um ou múltiplos arquivos (OFX, CSV, Excel, PDF) com auto-categorização
            inteligente do James IA.
          </p>
        </div>

        {emPrevia && (
          <Botao
            variant="ghost"
            onClick={() => {
              setEmPrevia(false)
            }}
          >
            ← Voltar para Seleção de Arquivos
          </Botao>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODO 1: UPLOAD & CONFIGURAÇÃO                            */}
      {/* ======================================================== */}
      {!emPrevia && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Área de Upload & Fila de Arquivos */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-verde-menta bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-creme/40 border-b border-verde-menta/60 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-verde-floresta" />
                    <CardTitle className="text-base text-verde-floresta">
                      Upload de Arquivos em Lote
                    </CardTitle>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-verde-menta text-verde-floresta">
                    Seleção Múltipla Ativa
                  </span>
                </div>
                <CardDescription className="text-xs text-texto-apoio">
                  Arraste ou selecione quantos extratos bancários, faturas de cartão ou relatórios
                  precisar.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* Seleção de Conta de Destino */}
                <div>
                  <label
                    htmlFor={contaSelectId}
                    className="block text-xs font-semibold text-texto-principal mb-1.5"
                  >
                    Conta Bancária de Destino *
                  </label>
                  {contas.length === 0 && !carregandoDados ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      Você ainda não possui contas cadastradas. Acesse o menu{' '}
                      <a href="/contas" className="underline font-bold">
                        Contas & Carteiras
                      </a>{' '}
                      para cadastrar sua primeira conta antes de importar.
                    </div>
                  ) : (
                    <select
                      id={contaSelectId}
                      value={contaDestinoId}
                      onChange={(e) => setContaDestinoId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage"
                    >
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} {c.banco ? `(${c.banco})` : ''} - Saldo inicial:{' '}
                          {formatarMoeda(Number(c.saldo_inicial) || 0)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Dropzone com suporte a múltiplos arquivos */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => inputArquivoRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    arrastando
                      ? 'border-verde-floresta bg-verde-menta/40 scale-[1.01]'
                      : 'border-verde-sage/60 hover:border-verde-floresta bg-creme/20 hover:bg-creme/50'
                  }`}
                >
                  <input
                    ref={inputArquivoRef}
                    type="file"
                    multiple
                    accept=".ofx,.csv,.xlsx,.xls,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        validarEAdicionarArquivos(e.target.files)
                      }
                    }}
                  />

                  <div className="h-12 w-12 rounded-2xl bg-verde-menta text-verde-floresta flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Upload className="h-6 w-6" />
                  </div>

                  <p className="text-sm font-bold text-verde-floresta">
                    Clique para selecionar ou arraste seus arquivos aqui
                  </p>
                  <p className="text-xs text-texto-apoio mt-1">
                    Você pode selecionar <strong>vários arquivos ao mesmo tempo</strong> (.OFX,
                    .CSV, .XLSX, .PDF)
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    <span className="text-[10px] font-semibold bg-white border border-verde-menta px-2 py-0.5 rounded-md text-emerald-700">
                      OFX (Recomendado)
                    </span>
                    <span className="text-[10px] font-semibold bg-white border border-verde-menta px-2 py-0.5 rounded-md text-blue-700">
                      CSV
                    </span>
                    <span className="text-[10px] font-semibold bg-white border border-verde-menta px-2 py-0.5 rounded-md text-green-800">
                      Excel (XLS/XLSX)
                    </span>
                    <span className="text-[10px] font-semibold bg-white border border-verde-menta px-2 py-0.5 rounded-md text-red-700">
                      PDF (Beta)
                    </span>
                  </div>
                </div>

                {/* Lista de Arquivos Selecionados */}
                {arquivosSelecionados.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold text-verde-floresta flex items-center gap-1.5">
                        <Layers className="h-4 w-4" />
                        <span>Arquivos Prontos para Processar ({arquivosSelecionados.length})</span>
                      </h2>
                      <button
                        type="button"
                        onClick={limparTodosArquivos}
                        className="text-xs text-vermelho-suave hover:underline font-semibold"
                      >
                        Limpar todos
                      </button>
                    </div>

                    <div className="divide-y divide-verde-menta/50 border border-verde-menta rounded-xl bg-white overflow-hidden max-h-60 overflow-y-auto">
                      {arquivosSelecionados.map((arq) => (
                        <div
                          key={arq.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-creme/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getIconeArquivo(arq.nome)}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-texto-principal truncate">
                                {arq.nome}
                              </p>
                              <span className="text-[10px] text-texto-apoio">
                                {(arq.tamanho / 1024).toFixed(1)} KB • Formato {arq.tipo}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removerArquivo(arq.id)
                            }}
                            className="p-1 rounded-md text-texto-apoio hover:text-vermelho-suave hover:bg-vermelho-suave/10 transition-colors"
                            title="Remover este arquivo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Botão de Ação Principal */}
                    <div className="pt-2">
                      <Botao
                        onClick={handleProcessarTodos}
                        carregando={processando}
                        disabled={processando || contas.length === 0}
                        className="w-full py-3 shadow-md gap-2"
                      >
                        <Sparkles className="h-4 w-4 text-dourado-suave" />
                        <span>
                          {processando
                            ? progressoTexto || 'Processando extratos...'
                            : `Processar & Categorizar ${arquivosSelecionados.length} ${
                                arquivosSelecionados.length === 1 ? 'Arquivo' : 'Arquivos'
                              }`}
                        </span>
                      </Botao>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações e Guia Rápido */}
            <Card className="border-verde-menta bg-white shadow-sm p-4">
              <button
                type="button"
                onClick={() => setAjudaAberta(!ajudaAberta)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-verde-floresta" />
                  <span className="font-semibold text-xs text-verde-floresta">
                    Qual formato de arquivo devo usar? (Dicas e Colunas Esperadas)
                  </span>
                </div>
                {ajudaAberta ? (
                  <ChevronUp className="h-4 w-4 text-texto-apoio" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-texto-apoio" />
                )}
              </button>

              {ajudaAberta && (
                <div className="mt-3 pt-3 border-t border-verde-menta text-xs text-texto-apoio space-y-2 leading-relaxed">
                  <p>
                    <strong>OFX (Recomendado):</strong> O formato bancário universal mais estável e
                    padronizado. Contém data exata, IDs bancários e valores sem ambiguidades.
                  </p>
                  <p>
                    <strong>CSV / Excel:</strong> Certifique-se de que o cabeçalho contenha colunas
                    reconhecíveis como <code>Data</code>, <code>Descrição</code> (ou{' '}
                    <code>Histórico</code>) e <code>Valor</code>.
                  </p>
                  <p>
                    <strong>PDF:</strong> Funciona para a maioria dos extratos textuais bancários.
                    Se o PDF for uma foto escaneada, prefira exportar em CSV/OFX no internet
                    banking.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Coluna Direita: Histórico de Documentos Importados */}
          <div className="space-y-6">
            <Card className="border-verde-menta bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-creme/40 border-b border-verde-menta/60 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-verde-floresta" />
                  <CardTitle className="text-sm text-verde-floresta">
                    Histórico de Importações
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-texto-apoio">
                  Extratos que você já enviou anteriormente.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 max-h-[520px] overflow-y-auto divide-y divide-verde-menta/40">
                {carregandoDados ? (
                  <div className="py-8 text-center text-xs text-texto-apoio">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-verde-floresta border-t-transparent mx-auto mb-2" />
                    Carregando histórico...
                  </div>
                ) : documentos.length === 0 ? (
                  <div className="p-6 text-center text-xs text-texto-apoio">
                    Nenhum documento importado ainda.
                  </div>
                ) : (
                  documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 hover:bg-creme/20 transition-colors flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-texto-principal truncate">
                          {doc.nome_arquivo}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-texto-apoio mt-0.5">
                          <span>{formatarData(doc.created_at)}</span>
                          <span>•</span>
                          <span className="font-medium text-verde-floresta">
                            {doc.total_lancamentos} lançamentos
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => abrirModalExcluirDoc(doc)}
                          className="p-1.5 rounded-lg text-texto-apoio hover:text-vermelho-suave hover:bg-vermelho-suave/10 transition-colors"
                          title="Excluir documento do histórico"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODO 2: PRÉ-VISUALIZAÇÃO & AUDITORIA DE LANÇAMENTOS     */}
      {/* ======================================================== */}
      {emPrevia && (
        <div className="space-y-6">
          {/* Card Resumo da Prévia */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
              <span className="text-[11px] font-medium text-texto-apoio block">
                Total a Importar
              </span>
              <span className="text-xl font-bold font-display text-verde-floresta">
                {totaisPrevia.total}
              </span>
            </Card>
            <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
              <span className="text-[11px] font-medium text-texto-apoio block">Receitas</span>
              <span className="text-xl font-bold font-display text-verde-sucesso">
                {totaisPrevia.receitas}
              </span>
            </Card>
            <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
              <span className="text-[11px] font-medium text-texto-apoio block">Despesas</span>
              <span className="text-xl font-bold font-display text-vermelho-suave">
                {totaisPrevia.despesas}
              </span>
            </Card>
            <Card className="border-verde-menta bg-white p-3.5 shadow-sm">
              <span className="text-[11px] font-medium text-texto-apoio block">
                Possíveis Duplicados
              </span>
              <span className="text-xl font-bold font-display text-amber-600">
                {totaisPrevia.duplicados}
              </span>
            </Card>
            <Card className="border-verde-menta bg-white p-3.5 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-texto-apoio block">Saldo Líquido</span>
              <span
                className={`text-lg font-bold font-display ${
                  totaisPrevia.valorTotal >= 0 ? 'text-verde-sucesso' : 'text-vermelho-suave'
                }`}
              >
                {formatarMoeda(totaisPrevia.valorTotal)}
              </span>
            </Card>
          </div>

          {/* Tabela de Auditoria e Edição dos Lançamentos */}
          <Card className="border-verde-menta bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-creme/40 border-b border-verde-menta/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base text-verde-floresta">
                  Revisão dos Lançamentos Extraídos
                </CardTitle>
                <CardDescription className="text-xs text-texto-apoio">
                  Ajuste descrições, tipos e categorias antes de confirmar a gravação. Lançamentos
                  desmarcados não serão salvos.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Botao
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmPrevia(false)}
                  disabled={salvando}
                >
                  Cancelar
                </Botao>
                <Botao
                  onClick={handleConfirmarImportacaoFinal}
                  carregando={salvando}
                  className="gap-2 shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirmar & Salvar no Banco</span>
                </Botao>
              </div>
            </CardHeader>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-creme/60 sticky top-0 z-10 border-b border-verde-menta text-texto-apoio uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">Importar</th>
                    <th className="p-3 w-28">Data</th>
                    <th className="p-3">Descrição / Estabelecimento</th>
                    <th className="p-3 w-32">Tipo</th>
                    <th className="p-3 w-36 text-right">Valor</th>
                    <th className="p-3 w-64">Categoria Sugerida</th>
                    <th className="p-3 w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-verde-menta/40">
                  {previaLancamentos.map((item) => {
                    return (
                      <tr
                        key={item.id_temporario}
                        className={`transition-colors ${
                          item.ignorar
                            ? 'bg-gray-50/70 opacity-60'
                            : item.duplicado_provavel
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : 'hover:bg-creme/20'
                        }`}
                      >
                        {/* Checkbox Importar */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={!item.ignorar}
                            onChange={() => toggleIgnorarLancamento(item.id_temporario)}
                            className="h-4 w-4 rounded border-verde-menta text-verde-floresta focus:ring-verde-sage cursor-pointer"
                          />
                        </td>

                        {/* Data */}
                        <td className="p-3 font-medium text-texto-principal whitespace-nowrap">
                          {formatarData(item.data)}
                        </td>

                        {/* Descrição editável */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) =>
                              handleAlterarDescricao(item.id_temporario, e.target.value)
                            }
                            className="w-full px-2 py-1 rounded-md border border-transparent hover:border-verde-menta focus:border-verde-floresta bg-transparent focus:bg-white text-xs text-texto-principal"
                          />
                        </td>

                        {/* Tipo: Receita / Despesa */}
                        <td className="p-3">
                          <select
                            value={item.tipo}
                            onChange={(e) =>
                              handleAlterarTipo(
                                item.id_temporario,
                                e.target.value as 'receita' | 'despesa',
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-semibold border border-verde-menta/60 bg-white ${
                              item.tipo === 'receita' ? 'text-verde-sucesso' : 'text-vermelho-suave'
                            }`}
                          >
                            <option value="despesa">Despesa</option>
                            <option value="receita">Receita</option>
                          </select>
                        </td>

                        {/* Valor */}
                        <td
                          className={`p-3 text-right font-bold whitespace-nowrap ${
                            item.tipo === 'receita' ? 'text-verde-sucesso' : 'text-vermelho-suave'
                          }`}
                        >
                          {item.tipo === 'despesa' ? '-' : '+'} {formatarMoeda(item.valor)}
                        </td>

                        {/* Dropdown de Categorias */}
                        <td className="p-3">
                          <select
                            value={item.subcategoria_id || ''}
                            onChange={(e) =>
                              handleAlterarCategoriaLancamento(item.id_temporario, e.target.value)
                            }
                            className="w-full px-2 py-1 rounded-md border border-verde-menta/60 bg-white text-xs text-texto-principal focus:ring-1 focus:ring-verde-sage"
                          >
                            <option value="">Sem categoria</option>
                            {todasSubcategorias
                              .filter((sub) => sub.tipo === item.tipo)
                              .map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.nome}
                                </option>
                              ))}
                          </select>
                        </td>

                        {/* Badge de Duplicado / James IA */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.duplicado_provavel ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800"
                              title="Lançamento com mesma data e valor já existe na conta"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Duplicado?
                            </span>
                          ) : item.sugestao_ia ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-verde-menta text-verde-floresta"
                              title="Categorizado automaticamente pelo James IA"
                            >
                              <Sparkles className="h-3 w-3 text-dourado-suave" />
                              IA James
                            </span>
                          ) : (
                            <span className="text-[10px] text-texto-apoio">Manual</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EXCLUSÃO DE DOCUMENTO DO HISTÓRICO                */}
      {/* ======================================================== */}
      <Modal
        aberto={modalExcluirDocAberto}
        aoFechar={() => !excluindoDoc && setModalExcluirDocAberto(false)}
        titulo="Excluir Extrato Importado"
        descricao={`Documento: ${documentoParaExcluir?.nome_arquivo}`}
        tamanho="md"
        rodape={
          <>
            <Botao
              variant="ghost"
              onClick={() => setModalExcluirDocAberto(false)}
              disabled={excluindoDoc}
            >
              Cancelar
            </Botao>
            <Botao variant="danger" onClick={handleConfirmarExclusaoDoc} carregando={excluindoDoc}>
              Confirmar Exclusão
            </Botao>
          </>
        }
      >
        <div className="space-y-4 text-xs text-texto-apoio">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Como você deseja realizar esta exclusão?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Este arquivo gerou <strong>{totalLancamentosVinculados} lançamentos</strong> no seu
              sistema. Escolha o comportamento desejado:
            </p>
          </div>

          <div className="space-y-2.5">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                tipoExclusao === 'apenas_registro'
                  ? 'border-verde-floresta bg-verde-menta/20'
                  : 'border-verde-menta/60 bg-white hover:bg-creme/30'
              }`}
            >
              <input
                type="radio"
                name="tipo_exclusao"
                checked={tipoExclusao === 'apenas_registro'}
                onChange={() => setTipoExclusao('apenas_registro')}
                className="mt-0.5 text-verde-floresta focus:ring-verde-sage"
              />
              <div>
                <p className="font-bold text-xs text-texto-principal">
                  1. Excluir apenas o registro do histórico
                </p>
                <p className="text-[11px] text-texto-apoio mt-0.5">
                  Remove o documento do histórico de arquivos, mas{' '}
                  <strong>mantém todos os lançamentos</strong> cadastrados em suas contas.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                tipoExclusao === 'documento_e_lancamentos'
                  ? 'border-vermelho-suave bg-vermelho-suave/10'
                  : 'border-verde-menta/60 bg-white hover:bg-creme/30'
              }`}
            >
              <input
                type="radio"
                name="tipo_exclusao"
                checked={tipoExclusao === 'documento_e_lancamentos'}
                onChange={() => setTipoExclusao('documento_e_lancamentos')}
                className="mt-0.5 text-vermelho-suave focus:ring-vermelho-suave"
              />
              <div>
                <p className="font-bold text-xs text-vermelho-suave">
                  2. Excluir documento E todos os lançamentos vinculados
                </p>
                <p className="text-[11px] text-texto-apoio mt-0.5">
                  Remove o histórico{' '}
                  <strong>
                    E deleta definitivamente todos os {totalLancamentosVinculados} lançamentos
                  </strong>{' '}
                  gerados por este extrato.
                </p>
              </div>
            </label>
          </div>

          <p className="text-[11px] text-red-600 font-semibold pt-1">
            ⚠️ Atenção: Esta ação não poderá ser desfeita.
          </p>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL DE SUCESSO                                         */}
      {/* ======================================================== */}
      <Modal
        aberto={sucessoModal}
        aoFechar={() => setSucessoModal(false)}
        titulo="Importação Concluída com Sucesso!"
        tamanho="sm"
        rodape={
          <Botao onClick={() => setSucessoModal(false)} className="w-full">
            Concluir & Visualizar Lançamentos
          </Botao>
        }
      >
        <div className="text-center py-4 space-y-3">
          <div className="h-14 w-14 rounded-full bg-verde-menta text-verde-floresta flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-verde-sucesso" />
          </div>

          <div>
            <h2 className="text-base font-bold text-verde-floresta">
              {salvosResumo.total} transações importadas
            </h2>
            <p className="text-xs text-texto-apoio mt-1">
              Todos os lançamentos aprovados foram salvos com sucesso e já estão refletidos no seu
              Dashboard e Extrato.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ImportacaoPage
