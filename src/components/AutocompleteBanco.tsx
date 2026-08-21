import React, { useState, useEffect, useRef, useId } from 'react'
import { buscarTodosBancos, filtrarBancos, BancoBrasilAPI } from '@/services/brasilApi'
import { Building2, Search, Loader2, Check, X } from 'lucide-react'

interface AutocompleteBancoProps {
  valorNome?: string
  valorCodigo?: string
  onSelectBanco: (banco: { nome: string; codigo: string }) => void
  disabled?: boolean
  id?: string
}

export const AutocompleteBanco: React.FC<AutocompleteBancoProps> = ({
  valorNome = '',
  valorCodigo = '',
  onSelectBanco,
  disabled = false,
  id,
}) => {
  const generatedId = useId()
  const inputId = id || `banco-autocomplete-${generatedId}`
  const listboxId = `banco-listbox-${generatedId}`

  const [busca, setBusca] = useState(valorNome)
  const [bancos, setBancos] = useState<BancoBrasilAPI[]>([])
  const [bancosFiltrados, setBancosFiltrados] = useState<BancoBrasilAPI[]>([])
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [indiceFoco, setIndiceFoco] = useState<number>(-1)
  const [erro, setErro] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sincroniza estado de busca se prop valorNome mudar externamente
  useEffect(() => {
    setBusca(valorNome)
  }, [valorNome])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false)
        setIndiceFoco(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Efeito com debounce de ~300ms para filtrar / buscar bancos
  useEffect(() => {
    if (disabled) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Se não tiver dados carregados ainda e o campo estiver aberto ou com texto
      if (bancos.length === 0) {
        setCarregando(true)
        setErro(null)
        try {
          const lista = await buscarTodosBancos()
          setBancos(lista)
          const filtrados = filtrarBancos(lista, busca)
          setBancosFiltrados(filtrados)
        } catch (err: unknown) {
          const erroObj = err as Error
          setErro(erroObj.message || 'Erro ao consultar Brasil API')
        } finally {
          setCarregando(false)
        }
      } else {
        const filtrados = filtrarBancos(bancos, busca)
        setBancosFiltrados(filtrados)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [busca, bancos, disabled])

  // Scroll automático para item focado via teclado
  useEffect(() => {
    if (indiceFoco >= 0 && itemRefs.current[indiceFoco]) {
      itemRefs.current[indiceFoco]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [indiceFoco])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setBusca(val)
    setAberto(true)
    setIndiceFoco(-1)
  }

  const handleFocus = () => {
    setAberto(true)
    // Se a lista de bancos ainda não foi carregada, inicia o fetch
    if (bancos.length === 0 && !carregando) {
      setCarregando(true)
      buscarTodosBancos()
        .then((lista) => {
          setBancos(lista)
          setBancosFiltrados(filtrarBancos(lista, busca))
        })
        .catch((err) => {
          setErro(err.message || 'Erro ao consultar Brasil API')
        })
        .finally(() => {
          setCarregando(false)
        })
    }
  }

  const handleSelecionar = (bancoItem: BancoBrasilAPI) => {
    const codigoFormatado =
      bancoItem.code !== null && bancoItem.code !== undefined
        ? String(bancoItem.code).padStart(3, '0')
        : ''
    const nomeAmigavel = bancoItem.name || bancoItem.fullName || ''

    setBusca(nomeAmigavel)
    setAberto(false)
    setIndiceFoco(-1)

    onSelectBanco({
      nome: nomeAmigavel,
      codigo: codigoFormatado,
    })
  }

  const handleLimpar = () => {
    setBusca('')
    setAberto(false)
    setIndiceFoco(-1)
    onSelectBanco({ nome: '', codigo: '' })
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!aberto) {
        setAberto(true)
        setIndiceFoco(0)
      } else {
        setIndiceFoco((prev) => (prev < bancosFiltrados.slice(0, 30).length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (aberto) {
        setIndiceFoco((prev) => (prev > 0 ? prev - 1 : 0))
      }
    } else if (e.key === 'Enter') {
      if (aberto && indiceFoco >= 0 && bancosFiltrados[indiceFoco]) {
        e.preventDefault()
        handleSelecionar(bancosFiltrados[indiceFoco])
      }
    } else if (e.key === 'Escape') {
      if (aberto) {
        e.preventDefault()
        setAberto(false)
        setIndiceFoco(-1)
      }
    } else if (e.key === 'Tab') {
      setAberto(false)
      setIndiceFoco(-1)
    }
  }

  // Limita a exibição a no máximo 40 itens no dropdown para performance
  const itensExibidos = bancosFiltrados.slice(0, 40)

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-texto-principal mb-1.5 flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-verde-floresta" />
          <span>Buscar Banco (Brasil API)</span>
        </span>
        {valorCodigo && (
          <span className="text-[11px] font-normal text-texto-apoio">
            Cód. selecionado:{' '}
            <strong className="text-verde-floresta font-mono">{valorCodigo}</strong>
          </span>
        )}
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-texto-apoio">
          {carregando ? (
            <Loader2 className="h-4 w-4 animate-spin text-verde-floresta" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            aberto && indiceFoco >= 0 ? `banco-opcao-${indiceFoco}` : undefined
          }
          placeholder="Digite o nome ou código (ex: Itaú, 341, Nubank, 260)..."
          value={busca}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-verde-menta bg-white text-sm text-texto-principal placeholder:text-texto-apoio/60 focus:outline-none focus:ring-2 focus:ring-verde-sage focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete="off"
        />

        {busca && !disabled && (
          <button
            type="button"
            onClick={handleLimpar}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-texto-apoio hover:text-texto-principal rounded-md transition-colors"
            title="Limpar busca de banco"
            aria-label="Limpar campo de busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown com os resultados da Brasil API */}
      {aberto && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Lista de bancos sugeridos"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl border border-verde-menta bg-white shadow-xl py-1 text-xs animate-fade-in-up"
        >
          {carregando && bancos.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-4 text-texto-apoio">
              <Loader2 className="h-4 w-4 animate-spin text-verde-floresta" />
              <span>Buscando instituições financeiras...</span>
            </div>
          ) : erro ? (
            <div className="p-3 text-vermelho-suave text-center">
              <p className="font-semibold">Não foi possível carregar os bancos da API.</p>
              <p className="text-[11px] text-texto-apoio mt-0.5">
                Você pode preencher o código manualmente abaixo.
              </p>
            </div>
          ) : itensExibidos.length === 0 ? (
            <div className="p-3 text-center text-texto-apoio">
              <p className="font-medium text-texto-principal">Nenhum banco encontrado</p>
              <p className="text-[11px] mt-0.5">
                Você pode preencher os dados bancários manualmente abaixo.
              </p>
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-texto-apoio tracking-wider border-b border-verde-menta/50 flex justify-between items-center bg-verde-menta/10">
                <span>Resultados ({bancosFiltrados.length})</span>
                <span className="text-[9px] font-normal normal-case">
                  Setas ↑↓ para navegar, Enter para escolher
                </span>
              </div>
              {itensExibidos.map((item, idx) => {
                const codeStr =
                  item.code !== null && item.code !== undefined
                    ? String(item.code).padStart(3, '0')
                    : 'S/C'
                const estaFocado = idx === indiceFoco
                const estaSelecionado =
                  valorCodigo &&
                  (String(item.code) === valorCodigo ||
                    String(item.code).padStart(3, '0') === valorCodigo)

                return (
                  <button
                    key={`${item.ispb}-${item.code}-${idx}`}
                    ref={(el) => {
                      itemRefs.current[idx] = el
                    }}
                    id={`banco-opcao-${idx}`}
                    role="option"
                    aria-selected={Boolean(estaSelecionado)}
                    type="button"
                    onClick={() => handleSelecionar(item)}
                    onMouseEnter={() => setIndiceFoco(idx)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                      estaFocado
                        ? 'bg-verde-menta text-verde-floresta font-medium'
                        : 'hover:bg-verde-menta/30'
                    } ${estaSelecionado ? 'bg-verde-menta/60 font-semibold' : ''}`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-verde-menta/80 text-verde-floresta shrink-0 font-bold">
                        {codeStr}
                      </span>
                      <div className="truncate">
                        <span className="text-texto-principal font-medium block truncate">
                          {item.name || item.fullName}
                        </span>
                        {item.fullName && item.fullName !== item.name && (
                          <span className="text-[10px] text-texto-apoio block truncate">
                            {item.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                    {estaSelecionado && (
                      <Check className="h-3.5 w-3.5 text-verde-floresta shrink-0" />
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
