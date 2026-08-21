import React, { useState, useEffect, useRef, useId } from 'react'
import { contasService } from '@/services/contas'
import { lancamentosService } from '@/services/lancamentos'
import { categoriasService } from '@/services/categorias'
import { documentosService } from '@/services/documentos'
import { supabase } from '@/lib/supabase/client'
import { parseCSV, parseXLSX, parsePDF } from '@/services/importacaoParser'
import { classificarEAutoCategorizar, type ItemPreviaImportacao } from '@/services/importacaoEngine'
import type { Conta, Categoria, DocumentoImportado, TipoDocumento, TipoLancamento } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  Building2,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react'

export const ImportacaoPage: React.FC = () => {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [contas, setContas] = useState<Conta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [historicoDocumentos, setHistoricoDocumentos] = useState<DocumentoImportado[]>([])
  const [carregando, setCarregando] = useState(true)

  // Conta Selecionada para o Upload
  const [contaSelecionadaId, setContaSelecionadaId] = useState<string>('')
  const [modalNovaContaAberto, setModalNovaContaAberto] = useState(false)
  const [nomeNovaConta, setNomeNovaConta] = useState('')
  const [salvandoNovaConta, setSalvandoNovaConta] = useState(false)

  // Estado do Arquivo / Upload / Parsing
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [processandoArquivo, setProcessandoArquivo] = useState(false)
  const [erroParsing, setErroParsing] = useState<string | null>(null)

  // Estado da Prévia
  const [etapaAtual, setEtapaAtual] = useState<'upload' | 'previa' | 'sucesso'>('upload')
  const [itensPrevia, setItensPrevia] = useState<ItemPreviaImportacao[]>([])
  const [documentoIdGerado, setDocumentoIdGerado] = useState<string | null>(null)
  const [salvandoImportacao, setSalvandoImportacao] = useState(false)
  const [totalImportadosSucesso, setTotalImportadosSucesso] = useState(0)

  const contaSelectId = useId()
  const nomeNovaContaId = useId()

  const carregarDadosIniciais = async () => {
    setCarregando(true)
    try {
      const [resContas, resCats, resDocs] = await Promise.all([
        contasService.listar(),
        categoriasService.listarArvore(),
        documentosService.listar(),
      ])

      if (resContas.error) {
        console.warn('Aviso ao carregar contas:', resContas.error.message)
      }
      if (resCats.error) {
        console.warn('Aviso ao carregar categorias:', resCats.error.message)
      }
      if (resDocs.error) {
        console.warn('Aviso ao carregar documentos:', resDocs.error.message)
      }

      if (resContas.data) {
        setContas(resContas.data)
        if (resContas.data.length > 0) {
          setContaSelecionadaId((prev) => (prev ? prev : resContas.data![0].id))
        }
      } else {
        setContas([])
      }

      if (resCats.data) {
        setCategorias(resCats.data)
      } else {
        setCategorias([])
      }

      if (resDocs.data) {
        setHistoricoDocumentos(resDocs.data)
      } else {
        setHistoricoDocumentos([])
      }
    } catch (err: unknown) {
      console.error('Erro no carregamento inicial de importação:', err)
      toast({
        title: 'Erro ao carregar dados da página',
        description: (err as Error).message || 'Tente recarregar a página.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  // Criar rápida de nova conta
  const handleCriarNovaContaRapida = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeNovaConta.trim()) return

    setSalvandoNovaConta(true)
    const { data, error } = await contasService.criar({
      nome: nomeNovaConta.trim(),
      tipo: 'conta_corrente',
      saldo_inicial: 0,
    })

    if (error) {
      toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' })
    } else if (data) {
      toast({ title: 'Conta criada com sucesso!' })
      setContas((prev) => [...prev, data])
      setContaSelecionadaId(data.id)
      setNomeNovaConta('')
      setModalNovaContaAberto(false)
    }
    setSalvandoNovaConta(false)
  }

  // Handler de seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processarArquivoUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processarArquivoUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // Processa o arquivo selecionado
  const processarArquivoUpload = async (file: File) => {
    if (!contaSelecionadaId) {
      toast({
        title: 'Selecione uma conta',
        description:
          'Por favor, selecione qual conta bancária pertence este extrato antes do envio.',
        variant: 'destructive',
      })
      return
    }

    const extensao = file.name.split('.').pop()?.toLowerCase()
    let tipoDoc: TipoDocumento = 'csv'
    if (extensao === 'xlsx') tipoDoc = 'xlsx'
    else if (extensao === 'xls') tipoDoc = 'xls'
    else if (extensao === 'pdf') tipoDoc = 'pdf'
    else if (extensao === 'ofx') tipoDoc = 'ofx'
    else if (extensao === 'csv') tipoDoc = 'csv'
    else {
      setErroParsing('Formato de arquivo não suportado. Envie um arquivo CSV, XLS, XLSX ou PDF.')
      return
    }

    setArquivoSelecionado(file)
    setProcessandoArquivo(true)
    setErroParsing(null)

    try {
      let parseResult: { sucesso: boolean; itens: any[]; erro?: string } = {
        sucesso: false,
        itens: [],
      }

      // Leitura de acordo com o tipo
      if (tipoDoc === 'csv' || tipoDoc === 'ofx') {
        const text = await file.text()
        parseResult = parseCSV(text)
      } else if (tipoDoc === 'xlsx' || tipoDoc === 'xls') {
        const buffer = await file.arrayBuffer()
        parseResult = parseXLSX(buffer)
      } else if (tipoDoc === 'pdf') {
        const buffer = await file.arrayBuffer()
        parseResult = await parsePDF(buffer)
      }

      // Se falhou no parse
      if (!parseResult.sucesso || parseResult.itens.length === 0) {
        // Registra documento no banco com status 'nao_importado' ou 'erro'
        await documentosService.registrar({
          nome_arquivo: file.name,
          tipo: tipoDoc,
          conta_id: contaSelecionadaId,
          status: 'nao_importado',
        })
        carregarDadosIniciais()

        setErroParsing(
          parseResult.erro ||
            'Não foi possível ler este arquivo. Sugerimos exportar o extrato como CSV ou XLSX pelo app do seu banco.',
        )
        setProcessandoArquivo(false)
        return
      }

      // Tenta upload do arquivo no Storage (bucket "extratos") de forma silenciosa e segura
      let caminhoStorage: string | null = null
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const filePath = `${user.id}/${Date.now()}_${file.name}`
          const { data: storageUpload } = await supabase.storage
            .from('extratos')
            .upload(filePath, file, { upsert: true })
          if (storageUpload) {
            caminhoStorage = storageUpload.path
          }
        }
      } catch (storageErr) {
        console.warn('Storage upload notice:', storageErr)
      }

      // Registra o documento como "processado" (aguardando confirmação do usuário)
      const resDoc = await documentosService.registrar({
        nome_arquivo: file.name,
        tipo: tipoDoc,
        conta_id: contaSelecionadaId,
        status: 'processado',
        caminho_storage: caminhoStorage,
      })

      if (resDoc.data) {
        setDocumentoIdGerado(resDoc.data.id)
      }

      // Busca todos os lançamentos existentes do usuário para deduplicação e auto-categorização
      const resLancExistentes = await lancamentosService.listar()
      const lancamentosExistentes = resLancExistentes.data || []

      // Extrai todas as categorias planas (pais e filhas)
      const categoriasPlanas: Categoria[] = []
      categorias.forEach((c) => {
        categoriasPlanas.push(c)
        if (c.subcategorias) {
          c.subcategorias.forEach((s) => categoriasPlanas.push(s))
        }
      })

      // Classifica em 3 grupos + Auto-categorização estrita
      const itensClassificados = classificarEAutoCategorizar({
        itensExtraidos: parseResult.itens,
        lancamentosExistentes,
        categorias: categoriasPlanas,
      })

      setItensPrevia(itensClassificados)
      setEtapaAtual('previa')
    } catch (err: unknown) {
      setErroParsing(`Erro no processamento do arquivo: ${(err as Error).message}`)
    } finally {
      setProcessandoArquivo(false)
    }
  }

  // Alteração manual de categoria de um item da prévia
  const handleAlterarCategoriaItem = (idTemp: string, novaCategoriaId: string) => {
    setItensPrevia((prev) =>
      prev.map((item) => {
        if (item.idTemp !== idTemp) return item
        // Busca subcategorias da nova categoria
        const cat = categorias.find((c) => c.id === novaCategoriaId)
        return {
          ...item,
          categoria_id: novaCategoriaId || null,
          subcategoria_id: null,
          categoriaNomeSugerida: cat?.nome,
        }
      }),
    )
  }

  const handleAlterarSubcategoriaItem = (idTemp: string, novaSubId: string) => {
    setItensPrevia((prev) =>
      prev.map((item) => {
        if (item.idTemp !== idTemp) return item
        return {
          ...item,
          subcategoria_id: novaSubId || null,
        }
      }),
    )
  }

  const handleToggleSelecaoItem = (idTemp: string) => {
    setItensPrevia((prev) =>
      prev.map((item) => {
        if (item.idTemp !== idTemp) return item
        return {
          ...item,
          selecionadoParaSalvar: !item.selecionadoParaSalvar,
        }
      }),
    )
  }

  // Grupos visuais da prévia
  const itensVaiLancar = itensPrevia.filter((i) => i.grupo === 'vai_lancar')
  const itensJaExiste = itensPrevia.filter((i) => i.grupo === 'ja_existe')
  const itensRevisao = itensPrevia.filter((i) => i.grupo === 'precisa_revisao')

  const totalParaSalvar = itensPrevia.filter((i) => i.selecionadoParaSalvar).length

  // Confirmação final da importação
  const handleConfirmarImportacao = async () => {
    const itensParaPersistir = itensPrevia.filter((i) => i.selecionadoParaSalvar)
    if (itensParaPersistir.length === 0) {
      toast({
        title: 'Nenhum item selecionado',
        description: 'Selecione pelo menos um lançamento para confirmar a importação.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoImportacao(true)

    try {
      let inseridosComSucesso = 0
      for (const item of itensParaPersistir) {
        const { error } = await lancamentosService.criar({
          tipo: item.tipo,
          valor: item.valor,
          data: item.data,
          descricao: item.descricao,
          categoria_id: item.categoria_id,
          subcategoria_id: item.subcategoria_id,
          conta_id: contaSelecionadaId,
          documento_id: documentoIdGerado,
        })
        if (!error) {
          inseridosComSucesso++
        }
      }

      // Atualiza status do documento para 'importado'
      if (documentoIdGerado) {
        await documentosService.atualizarStatus(documentoIdGerado, 'importado')
      }

      setTotalImportadosSucesso(inseridosComSucesso)
      setEtapaAtual('sucesso')
      toast({
        title: 'Importação concluída com sucesso!',
        description: `${inseridosComSucesso} lançamentos foram persistidos na conta.`,
      })
      carregarDadosIniciais()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao persistir lançamentos',
        description: (err as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSalvandoImportacao(false)
    }
  }

  const reiniciarImportacao = () => {
    setEtapaAtual('upload')
    setArquivoSelecionado(null)
    setItensPrevia([])
    setErroParsing(null)
    setDocumentoIdGerado(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-verde-floresta tracking-tight">
            Importação Inteligente de Extratos
          </h1>
          <p className="text-sm text-texto-apoio mt-1">
            Importe arquivos CSV, XLS, XLSX ou PDF com deduplicação rigorosa e auto-categorização
            histórica.
          </p>
        </div>

        {etapaAtual !== 'upload' && (
          <Botao variant="secondary" size="sm" onClick={reiniciarImportacao}>
            Importar Outro Arquivo
          </Botao>
        )}
      </div>

      {/* ======================================================== */}
      {/* ETAPA 1: SELEÇÃO DA CONTA + DROPZONE DE UPLOAD           */}
      {/* ======================================================== */}
      {etapaAtual === 'upload' && (
        <div className="space-y-6">
          {/* Card de Configuração Inicial da Importação */}
          <Card className="border-verde-menta bg-white shadow-sm p-5">
            <div className="max-w-xl space-y-4">
              <div>
                <label
                  htmlFor={contaSelectId}
                  className="block text-xs font-semibold text-texto-principal mb-1.5"
                >
                  1. Selecione a Conta Destino do Extrato *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id={contaSelectId}
                    value={contaSelecionadaId}
                    onChange={(e) => setContaSelecionadaId(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-verde-menta bg-creme/30 text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage focus:bg-white transition-all font-medium"
                  >
                    {contas.length === 0 && <option value="">Nenhuma conta cadastrada</option>}
                    {contas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.banco ? `(${c.banco})` : ''} — Saldo inicial: R${' '}
                        {Number(c.saldo_inicial || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <Botao
                    type="button"
                    variant="menta"
                    size="sm"
                    onClick={() => setModalNovaContaAberto(true)}
                    className="gap-1 whitespace-nowrap h-10 px-3"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nova Conta</span>
                  </Botao>
                </div>
              </div>
            </div>
          </Card>

          {/* Erro de Parsing / Mensagem de Orientação */}
          {erroParsing && (
            <div className="p-4 rounded-2xl bg-vermelho-suave/10 border border-vermelho-suave/30 text-texto-principal flex items-start gap-3 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-vermelho-suave shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <strong className="text-vermelho-suave font-semibold block">
                  Não foi possível processar este arquivo
                </strong>
                <p className="text-texto-apoio">{erroParsing}</p>
                <p className="text-texto-apoio font-medium pt-1">
                  💡 Dica do James: Arquivos CSV ou XLSX gerados diretamente pelo Internet Banking
                  ou app do seu banco são 100% estruturados e garantem a melhor precisão.
                </p>
              </div>
            </div>
          )}

          {/* Dropzone de Upload */}
          <Card
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-dashed border-2 border-verde-sage/60 hover:border-verde-floresta bg-white hover:bg-verde-menta/10 transition-all duration-200 cursor-pointer p-10 text-center rounded-2xl shadow-sm"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx,.pdf,.ofx"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-verde-menta text-verde-floresta flex items-center justify-center mx-auto shadow-sm">
                {processandoArquivo ? (
                  <RefreshCw className="h-8 w-8 animate-spin text-verde-floresta" />
                ) : (
                  <UploadCloud className="h-8 w-8 text-verde-floresta" />
                )}
              </div>

              <div className="space-y-1">
                <h2 className="font-display font-bold text-lg text-verde-floresta">
                  {processandoArquivo
                    ? 'Analisando e estruturando seu arquivo...'
                    : 'Clique ou arraste seu extrato bancário aqui'}
                </h2>
                <p className="text-xs text-texto-apoio">
                  Formatos aceitos: <strong>CSV, XLS, XLSX</strong> (Recomendados) e{' '}
                  <strong>PDF</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-creme text-texto-apoio border border-verde-menta">
                  Deduplicação 100%
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-creme text-texto-apoio border border-verde-menta">
                  Auto-categorização
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-creme text-texto-apoio border border-verde-menta">
                  Prévia Obrigatória
                </span>
              </div>
            </div>
          </Card>

          {/* Histórico de Documentos Importados */}
          <Card className="border-verde-menta bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-verde-menta/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-verde-floresta">
                    Histórico de Importações
                  </CardTitle>
                  <CardDescription className="text-xs text-texto-apoio">
                    Registro de arquivos enviados e status de processamento.
                  </CardDescription>
                </div>
                <Botao variant="ghost" size="sm" onClick={carregarDadosIniciais}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Botao>
              </div>
            </CardHeader>

            {historicoDocumentos.length === 0 ? (
              <div className="p-6 text-center text-xs text-texto-apoio">
                Nenhum documento importado até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-creme/60 text-texto-apoio font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Data do Upload</th>
                      <th className="py-2.5 px-4">Nome do Arquivo</th>
                      <th className="py-2.5 px-4">Tipo</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-verde-menta/40">
                    {historicoDocumentos.map((doc) => {
                      let dataFormatada = '—'
                      try {
                        if (doc.created_at) {
                          const dt = new Date(doc.created_at)
                          dataFormatada = !isNaN(dt.getTime())
                            ? dt.toLocaleString('pt-BR')
                            : doc.created_at
                        }
                      } catch {
                        dataFormatada = '—'
                      }

                      return (
                        <tr key={doc.id} className="hover:bg-verde-menta/10">
                          <td className="py-2.5 px-4 tabular-nums text-texto-apoio">
                            {dataFormatada}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-texto-principal flex items-center gap-2">
                            {doc.tipo === 'pdf' ? (
                              <FileText className="h-4 w-4 text-vermelho-suave shrink-0" />
                            ) : (
                              <FileSpreadsheet className="h-4 w-4 text-verde-sucesso shrink-0" />
                            )}
                            <span className="truncate max-w-[200px] sm:max-w-xs">
                              {doc.nome_arquivo || 'Arquivo sem nome'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 uppercase text-texto-apoio font-semibold">
                            {doc.tipo || '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                doc.status === 'importado'
                                  ? 'bg-verde-sucesso/15 text-verde-sucesso'
                                  : doc.status === 'processado'
                                    ? 'bg-dourado/20 text-texto-principal'
                                    : 'bg-vermelho-suave/15 text-vermelho-suave'
                              }`}
                            >
                              {doc.status === 'importado' && <CheckCircle2 className="h-3 w-3" />}
                              {doc.status === 'processado' && <Clock className="h-3 w-3" />}
                              {doc.status === 'nao_importado' && <XCircle className="h-3 w-3" />}
                              {doc.status === 'erro' && <AlertTriangle className="h-3 w-3" />}
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* ETAPA 2: PRÉVIA TRIPLA OBRIGATÓRIA                       */}
      {/* ======================================================== */}
      {etapaAtual === 'previa' && (
        <div className="space-y-6 animate-fade-in">
          {/* Banner Informativo com Contadores dos 3 Grupos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Verde: Vai lançar */}
            <div className="p-4 rounded-2xl bg-verde-sucesso/10 border border-verde-sucesso/30 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-verde-sucesso text-white flex items-center justify-center font-bold shrink-0">
                {itensVaiLancar.length}
              </div>
              <div>
                <strong className="text-xs font-bold text-verde-sucesso block">
                  🟢 Vai Lançar
                </strong>
                <p className="text-[11px] text-texto-apoio">
                  Lançamentos novos com auto-categorização pronta.
                </p>
              </div>
            </div>

            {/* 2. Amarelo: Já existe */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                {itensJaExiste.length}
              </div>
              <div>
                <strong className="text-xs font-bold text-amber-800 block">
                  🟡 Já Existe (Deduplicados)
                </strong>
                <p className="text-[11px] text-texto-apoio">
                  Data + Valor + Descrição 100% idênticos. Não serão duplicados.
                </p>
              </div>
            </div>

            {/* 3. Vermelho: Precisa de Revisão */}
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-vermelho-suave text-white flex items-center justify-center font-bold shrink-0">
                {itensRevisao.length}
              </div>
              <div>
                <strong className="text-xs font-bold text-vermelho-suave block">
                  🔴 Precisa de Revisão
                </strong>
                <p className="text-[11px] text-texto-apoio">
                  Sem categoria ou com correspondência parcial de valor/data.
                </p>
              </div>
            </div>
          </div>

          {/* Barra de Ação da Confirmação */}
          <Card className="border-verde-floresta bg-white shadow-sm p-4 sticky top-2 z-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-texto-principal">
                  Total selecionado para entrar no banco:
                </span>
                <span className="font-display font-bold text-base text-verde-floresta tabular-nums">
                  {totalParaSalvar} lançamentos
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Botao
                  variant="ghost"
                  size="sm"
                  onClick={reiniciarImportacao}
                  disabled={salvandoImportacao}
                >
                  Cancelar
                </Botao>
                <Botao
                  onClick={handleConfirmarImportacao}
                  carregando={salvandoImportacao}
                  disabled={totalParaSalvar === 0}
                  className="gap-2 shadow-md"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirmar Importação</span>
                </Botao>
              </div>
            </div>
          </Card>

          {/* TABELA DETALHADA DA PRÉVIA */}
          <Card className="border-verde-menta bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-creme/60 border-b border-verde-menta text-texto-apoio font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Importar?</th>
                    <th className="py-3 px-3">Status / Grupo</th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Descrição Extraída</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Subcategoria</th>
                    <th className="py-3 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-verde-menta/40">
                  {itensPrevia.map((item) => {
                    const isReceita = item.tipo === 'receita'
                    const catPaiSelecionada = categorias.find((c) => c.id === item.categoria_id)
                    const subcategoriasDisponiveis = catPaiSelecionada?.subcategorias || []

                    return (
                      <tr
                        key={item.idTemp}
                        className={`transition-colors ${
                          item.grupo === 'ja_existe'
                            ? 'bg-amber-50/50 opacity-70'
                            : item.grupo === 'precisa_revisao'
                              ? 'bg-red-50/40'
                              : 'hover:bg-verde-menta/20'
                        }`}
                      >
                        {/* Checkbox de Inclusão */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selecionadoParaSalvar}
                            onChange={() => handleToggleSelecaoItem(item.idTemp)}
                            className="h-4 w-4 rounded border-verde-menta text-verde-floresta focus:ring-verde-sage"
                          />
                        </td>

                        {/* Grupo Badge & Motivo */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.grupo === 'vai_lancar' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-verde-sucesso/15 text-verde-sucesso">
                              🟢 Vai lançar
                            </span>
                          )}
                          {item.grupo === 'ja_existe' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800">
                              🟡 Já existe
                            </span>
                          )}
                          {item.grupo === 'precisa_revisao' && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-vermelho-suave/15 text-vermelho-suave">
                                🔴 Revisão
                              </span>
                              <span
                                className="block text-[10px] text-texto-apoio max-w-xs truncate"
                                title={item.motivoGrupo}
                              >
                                {item.motivoGrupo}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Data */}
                        <td className="py-3 px-3 whitespace-nowrap tabular-nums text-texto-principal font-medium">
                          {item.data ? item.data.split('-').reverse().join('/') : '—'}
                        </td>

                        {/* Descrição */}
                        <td className="py-3 px-3 font-semibold text-texto-principal">
                          <span className="truncate max-w-xs block" title={item.descricao}>
                            {item.descricao}
                          </span>
                        </td>

                        {/* Categoria Select */}
                        <td className="py-3 px-3 min-w-[160px]">
                          <select
                            value={item.categoria_id || ''}
                            onChange={(e) =>
                              handleAlterarCategoriaItem(item.idTemp, e.target.value)
                            }
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-verde-sage ${
                              !item.categoria_id
                                ? 'border-vermelho-suave bg-red-50 text-vermelho-suave font-semibold'
                                : 'border-verde-menta bg-white text-texto-principal'
                            }`}
                          >
                            <option value="">Selecione categoria</option>
                            {categorias
                              .filter((c) => !c.categoria_pai_id && c.tipo === item.tipo)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nome}
                                </option>
                              ))}
                          </select>
                        </td>

                        {/* Subcategoria Select */}
                        <td className="py-3 px-3 min-w-[160px]">
                          <select
                            value={item.subcategoria_id || ''}
                            disabled={!item.categoria_id || subcategoriasDisponiveis.length === 0}
                            onChange={(e) =>
                              handleAlterarSubcategoriaItem(item.idTemp, e.target.value)
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-verde-menta bg-white text-xs text-texto-principal disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-verde-sage"
                          >
                            <option value="">
                              {!item.categoria_id
                                ? '—'
                                : subcategoriasDisponiveis.length === 0
                                  ? 'Sem subcategorias'
                                  : 'Subcategoria (opcional)'}
                            </option>
                            {subcategoriasDisponiveis.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.nome}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Valor */}
                        <td
                          className={`py-3 px-3 text-right font-display font-bold tabular-nums whitespace-nowrap ${
                            isReceita ? 'text-verde-sucesso' : 'text-vermelho-suave'
                          }`}
                        >
                          {isReceita ? '+ ' : '- '}
                          {item.valor.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
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
      {/* ETAPA 3: SUCESSO DA IMPORTAÇÃO                           */}
      {/* ======================================================== */}
      {etapaAtual === 'sucesso' && (
        <Card className="border-verde-sucesso/40 bg-white p-12 text-center shadow-sm max-w-xl mx-auto animate-fade-in-up">
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-verde-sucesso/15 text-verde-sucesso flex items-center justify-center mx-auto ring-8 ring-verde-sucesso/10">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-1">
              <h2 className="font-display font-bold text-2xl text-verde-floresta">
                Importação Realizada com Sucesso!
              </h2>
              <p className="text-sm text-texto-apoio">
                <strong>{totalImportadosSucesso} lançamentos</strong> foram criados e vinculados à
                sua conta com precisão.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Botao variant="secondary" onClick={reiniciarImportacao}>
                Importar Outro Extrato
              </Botao>
              <Botao onClick={() => (window.location.href = '/lancamentos')}>Ver Lançamentos</Botao>
            </div>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* MODAL CRIAÇÃO RÁPIDA DE CONTA                            */}
      {/* ======================================================== */}
      <Modal
        aberto={modalNovaContaAberto}
        aoFechar={() => !salvandoNovaConta && setModalNovaContaAberto(false)}
        titulo="Criar Nova Conta Bancária"
        descricao="Crie rapidamente uma conta para associar aos lançamentos deste extrato."
        tamanho="sm"
      >
        <form onSubmit={handleCriarNovaContaRapida} className="space-y-4">
          <div>
            <label
              htmlFor={nomeNovaContaId}
              className="block text-xs font-semibold text-texto-principal mb-1.5"
            >
              Nome da Conta *
            </label>
            <input
              id={nomeNovaContaId}
              type="text"
              required
              placeholder="Ex: Inter PJ, Carteira XP"
              value={nomeNovaConta}
              onChange={(e) => setNomeNovaConta(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-verde-menta">
            <Botao
              type="button"
              variant="ghost"
              onClick={() => setModalNovaContaAberto(false)}
              disabled={salvandoNovaConta}
            >
              Cancelar
            </Botao>
            <Botao type="submit" carregando={salvandoNovaConta}>
              Criar Conta
            </Botao>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ImportacaoPage
