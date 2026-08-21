import React, { useState, useEffect, useId } from 'react'
import { statusService } from '@/services/status'
import type { ContaStatus } from '@/types'
import { Card } from '@/components/ui/card'
import { Botao } from '@/components/ui/botao'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit2, Trash2, AlertCircle, RefreshCw, Lock, Tag } from 'lucide-react'

const CORES_PREDEFINIDAS = [
  { nome: 'Verde', hex: '#2E8B57' },
  { nome: 'Azul', hex: '#3B82F6' },
  { nome: 'Cinza', hex: '#6B7280' },
  { nome: 'Cinza Claro', hex: '#9CA3AF' },
  { nome: 'Vermelho', hex: '#C0392B' },
  { nome: 'Dourado', hex: '#D4A853' },
  { nome: 'Roxo', hex: '#8B5CF6' },
  { nome: 'Laranja', hex: '#F97316' },
  { nome: 'Rosa', hex: '#EC4899' },
  { nome: 'Verde Claro', hex: '#10B981' },
]

export const StatusSection: React.FC = () => {
  const { toast } = useToast()
  const [listaStatus, setListaStatus] = useState<ContaStatus[]>([])
  const [carregando, setCarregando] = useState(true)

  // Modais
  const [modalCriarEditarAberto, setModalCriarEditarAberto] = useState(false)
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [statusEmEdicao, setStatusEmEdicao] = useState<ContaStatus | null>(null)
  const [statusParaExcluir, setStatusParaExcluir] = useState<ContaStatus | null>(null)
  const [totalContasUsando, setTotalContasUsando] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Form states
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState('#2E8B57')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const nomeId = useId()
  const corId = useId()

  const carregarStatus = async () => {
    setCarregando(true)
    const { data, error } = await statusService.listar()
    if (error) {
      toast({
        title: 'Erro ao carregar status',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setListaStatus(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarStatus()
  }, [])

  const abrirModalNovo = () => {
    setStatusEmEdicao(null)
    setNome('')
    setCor('#2E8B57')
    setErroForm(null)
    setModalCriarEditarAberto(true)
  }

  const abrirModalEditar = (st: ContaStatus) => {
    if (st.user_id === null) {
      toast({
        title: 'Status protegido',
        description: 'Status padrão do sistema não podem ser editados.',
        variant: 'destructive',
      })
      return
    }
    setStatusEmEdicao(st)
    setNome(st.nome)
    setCor(st.cor || '#6B7280')
    setErroForm(null)
    setModalCriarEditarAberto(true)
  }

  const abrirModalExcluir = async (st: ContaStatus) => {
    if (st.user_id === null) {
      toast({
        title: 'Status protegido',
        description: 'Status padrão do sistema não podem ser excluídos.',
        variant: 'destructive',
      })
      return
    }
    setStatusParaExcluir(st)
    const total = await statusService.contarContasUsando(st.id)
    setTotalContasUsando(total)
    setModalExcluirAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErroForm('Por favor, informe o nome do status.')
      return
    }

    setSalvando(true)
    setErroForm(null)

    if (statusEmEdicao) {
      const { error } = await statusService.atualizar(statusEmEdicao.id, {
        nome: nome.trim(),
        cor,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Status atualizado com sucesso!' })
        setModalCriarEditarAberto(false)
        carregarStatus()
      }
    } else {
      const { error } = await statusService.criar({
        nome: nome.trim(),
        cor,
      })
      if (error) {
        setErroForm(error.message)
      } else {
        toast({ title: 'Status criado com sucesso!' })
        setModalCriarEditarAberto(false)
        carregarStatus()
      }
    }
    setSalvando(false)
  }

  const handleConfirmarExcluir = async () => {
    if (!statusParaExcluir) return
    setExcluindo(true)
    const { error } = await statusService.excluir(statusParaExcluir.id)
    if (error) {
      toast({
        title: 'Não foi possível excluir o status',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Status excluído com sucesso!' })
      setModalExcluirAberto(false)
      setStatusParaExcluir(null)
      carregarStatus()
    }
    setExcluindo(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-verde-floresta">Status de Contas</h2>
          <p className="text-xs text-texto-apoio mt-0.5">
            Classifique o ciclo de vida de suas contas (Ativa, Inativa, Pausada, Cancelada ou
            personalizadas).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Botao variant="menta" size="sm" onClick={carregarStatus} disabled={carregando}>
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
          </Botao>
          <Botao onClick={abrirModalNovo} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Novo Status</span>
          </Botao>
        </div>
      </div>

      {carregando ? (
        <div className="py-12 text-center text-texto-apoio space-y-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-verde-floresta border-t-transparent mx-auto" />
          <p className="text-xs">Carregando status...</p>
        </div>
      ) : listaStatus.length === 0 ? (
        <Card className="border-dashed border-2 border-verde-menta bg-white p-10 text-center">
          <Tag className="h-10 w-10 text-verde-sage mx-auto mb-2" />
          <p className="text-sm font-semibold text-verde-floresta">Nenhum status encontrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {listaStatus.map((st) => {
            const isSistema = st.user_id === null

            return (
              <Card
                key={st.id}
                className="border-verde-menta bg-white p-4 shadow-sm flex items-center justify-between gap-3 hover:border-verde-sage/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-4 w-4 rounded-full shrink-0 shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: st.cor || '#6B7280' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-texto-principal truncate">
                        {st.nome}
                      </span>
                      {isSistema && (
                        <span
                          className="text-[9px] text-texto-apoio bg-creme px-1.5 py-0.2 rounded border border-verde-menta inline-flex items-center gap-0.5"
                          title="Padrão do Sistema (Não editável)"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          Padrão
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-texto-apoio font-mono uppercase">
                      {st.cor}
                    </span>
                  </div>
                </div>

                {!isSistema && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(st)}
                      className="p-1.5 rounded-lg text-texto-apoio hover:bg-verde-menta hover:text-verde-floresta transition-colors"
                      title="Editar status"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirModalExcluir(st)}
                      className="p-1.5 rounded-lg text-texto-apoio hover:bg-vermelho-suave/10 hover:text-vermelho-suave transition-colors"
                      title="Excluir status"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        aberto={modalCriarEditarAberto}
        aoFechar={() => !salvando && setModalCriarEditarAberto(false)}
        titulo={statusEmEdicao ? 'Editar Status' : 'Novo Status de Conta'}
        descricao="Crie uma etiqueta visual de status para suas contas."
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
              Nome do Status *
            </label>
            <input
              id={nomeId}
              type="text"
              required
              placeholder="Ex: Em Análise, Bloqueada"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal focus:outline-none focus:ring-2 focus:ring-verde-sage"
            />
          </div>

          <div>
            <label
              htmlFor={corId}
              className="block text-xs font-semibold text-texto-principal mb-1.5"
            >
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                id={corId}
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-10 w-14 rounded-lg border border-verde-menta cursor-pointer p-0.5 bg-white"
              />
              <span className="text-xs font-mono font-semibold text-texto-principal">{cor}</span>
            </div>

            {/* Paleta rápida */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CORES_PREDEFINIDAS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCor(c.hex)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    cor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-verde-floresta scale-110 shadow-sm'
                      : 'border-white'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.nome}
                />
              ))}
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
              {statusEmEdicao ? 'Salvar' : 'Criar Status'}
            </Botao>
          </div>
        </form>
      </Modal>

      {/* Modal Excluir */}
      <Modal
        aberto={modalExcluirAberto}
        aoFechar={() => !excluindo && setModalExcluirAberto(false)}
        titulo="Excluir Status"
        descricao={`Deseja excluir o status "${statusParaExcluir?.nome}"?`}
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
              Excluir Status
            </Botao>
          </>
        }
      >
        <div className="space-y-3 text-xs text-texto-apoio">
          {totalContasUsando > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Aviso: Status em uso</span>
              </div>
              <p className="text-[11px]">
                Existem <strong>{totalContasUsando} contas</strong> usando este status. Ao excluir,
                o campo status dessas contas ficará vazio.
              </p>
            </div>
          )}
          <p>Esta ação não pode ser desfeita.</p>
        </div>
      </Modal>
    </div>
  )
}

export default StatusSection
