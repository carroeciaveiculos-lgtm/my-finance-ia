import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getSaudacaoHorario, JAMES_LEIS, JAMES_TONE, JAMES_MICROCOPY } from '@/lib/james'
import { Modal } from '@/components/ui/modal'
import { Botao } from '@/components/ui/botao'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  FileSpreadsheet,
  Target,
  CreditCard,
  TrendingUp,
  CheckCheck,
  Bot,
  FileText,
  LogOut,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react'

interface NavItem {
  rotulo: string
  rota: string
  icone: React.ElementType
  emBreve?: boolean
}

const ITENS_MENU: NavItem[] = [
  { rotulo: 'Dashboard', rota: '/dashboard', icone: LayoutDashboard },
  { rotulo: 'Contas & Carteiras', rota: '/contas', icone: Wallet },
  { rotulo: 'Lançamentos', rota: '/lancamentos', icone: ArrowLeftRight },
  { rotulo: 'Importação de Extratos', rota: '/importacao', icone: FileSpreadsheet },
  { rotulo: 'Metas', rota: '/metas', icone: Target },
  { rotulo: 'Dívidas & Crédito', rota: '/dividas', icone: CreditCard, emBreve: true },
  { rotulo: 'Investimentos', rota: '/investimentos', icone: TrendingUp, emBreve: true },
  { rotulo: 'Conciliação', rota: '/conciliacao', icone: CheckCheck, emBreve: true },
  { rotulo: 'Assistente James', rota: '/james', icone: Bot, emBreve: true },
  { rotulo: 'Relatórios', rota: '/relatorios', icone: FileText, emBreve: true },
]

export const AppLayout: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [modalJamesAberto, setModalJamesAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)

  const nomeUsuario =
    profile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'
  const saudacao = getSaudacaoHorario(nomeUsuario)

  const handleLogout = async () => {
    setSaindo(true)
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-creme text-texto-principal flex flex-col lg:flex-row font-sans selection:bg-verde-menta selection:text-verde-floresta">
      {/* ======================================================== */}
      {/* 1. HEADER MOBILE & TABLET TOPBAR                         */}
      {/* ======================================================== */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-verde-menta px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-verde-floresta to-verde-sage flex items-center justify-center text-white font-display font-bold shadow-sm">
            🌱
          </div>
          <div>
            <span className="font-display font-bold text-base text-verde-floresta">
              My Finance IA
            </span>
            <span className="block text-[10px] font-medium text-texto-apoio uppercase tracking-wider">
              Gestão Financeira
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalJamesAberto(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-verde-menta to-verde-sage/30 text-verde-floresta text-xs font-semibold border border-dourado/40 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-dourado" />
            <span>James</span>
          </button>
          <button
            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
            className="p-2 rounded-lg text-texto-apoio hover:bg-verde-menta hover:text-texto-principal"
            aria-label="Abrir menu"
          >
            {menuMobileAberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SIDEBAR DESKTOP & TABLET (≥1024px e 768-1023px)      */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-verde-menta p-4 min-h-screen sticky top-0 shadow-sm justify-between">
        <div className="space-y-6">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-verde-floresta to-verde-sage flex items-center justify-center text-white text-lg shadow-sm">
              🌱
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-verde-floresta tracking-tight leading-none">
                My Finance IA
              </h1>
              <p className="text-[11px] font-medium text-texto-apoio mt-1">
                Jardim Financeiro Inteligente
              </p>
            </div>
          </div>

          {/* Widget do James no Menu */}
          <div
            onClick={() => setModalJamesAberto(true)}
            className="group cursor-pointer rounded-2xl bg-gradient-to-br from-verde-menta via-verde-menta to-verde-sage/30 p-3.5 border border-dourado/50 shadow-sm transition-all duration-200 hover:shadow-james hover:border-dourado"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-verde-floresta flex items-center justify-center text-white shadow ring-2 ring-dourado">
                  <Bot className="h-5 w-5 text-dourado" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-verde-sucesso ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm text-verde-floresta">James</span>
                  <span className="text-[10px] font-semibold bg-dourado/20 text-texto-principal px-1.5 py-0.2 rounded border border-dourado/30">
                    Ética & Leis
                  </span>
                </div>
                <p className="text-xs text-texto-apoio truncate mt-0.5">
                  Clique para ver as 5 Leis
                </p>
              </div>
            </div>
          </div>

          {/* Itens de Navegação */}
          <nav className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-texto-apoio uppercase tracking-wider mb-2">
              Navegação
            </p>
            {ITENS_MENU.map((item) => {
              const Icone = item.icone
              const isAtivo = location.pathname === item.rota

              return (
                <NavLink
                  key={item.rota}
                  to={item.rota}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-verde-floresta text-white shadow-sm font-semibold'
                        : 'text-texto-principal hover:bg-verde-menta hover:text-verde-floresta'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icone className={`h-4 w-4 ${isAtivo ? 'text-white' : 'text-texto-apoio'}`} />
                    <span>{item.rotulo}</span>
                  </div>
                  {item.emBreve && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isAtivo ? 'bg-white/20 text-white' : 'bg-verde-menta text-texto-apoio'
                      }`}
                    >
                      Em breve
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Usuário + Logout */}
        <div className="pt-4 border-t border-verde-menta space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-creme/70 border border-verde-menta/50">
            <div className="h-9 w-9 rounded-full bg-verde-sage/30 flex items-center justify-center text-verde-floresta font-semibold">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-texto-principal truncate">{nomeUsuario}</p>
              <p className="text-[11px] text-texto-apoio truncate">{user?.email}</p>
            </div>
          </div>

          <Botao
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            carregando={saindo}
            className="w-full justify-center text-xs h-9 border-verde-menta hover:bg-vermelho-suave/10 hover:text-vermelho-suave hover:border-vermelho-suave/30"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair do sistema</span>
          </Botao>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 3. MENU MOBILE DRAWER (<1024px)                          */}
      {/* ======================================================== */}
      {menuMobileAberto && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white animate-fade-in p-5 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-verde-menta">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-verde-floresta to-verde-sage flex items-center justify-center text-white shadow-sm">
                🌱
              </div>
              <div>
                <span className="font-display font-bold text-base text-verde-floresta">
                  My Finance IA
                </span>
                <span className="block text-[10px] font-medium text-texto-apoio">
                  Menu Principal
                </span>
              </div>
            </div>
            <button
              onClick={() => setMenuMobileAberto(false)}
              className="p-2 rounded-lg text-texto-apoio hover:bg-verde-menta"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="py-4 space-y-2">
            <div className="p-3 rounded-xl bg-verde-menta/50 border border-verde-menta mb-4">
              <p className="text-xs font-semibold text-verde-floresta">{nomeUsuario}</p>
              <p className="text-[11px] text-texto-apoio">{user?.email}</p>
            </div>

            {ITENS_MENU.map((item) => {
              const Icone = item.icone
              return (
                <NavLink
                  key={item.rota}
                  to={item.rota}
                  onClick={() => setMenuMobileAberto(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-verde-floresta text-white font-semibold'
                        : 'text-texto-principal hover:bg-verde-menta'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icone className="h-4 w-4" />
                    <span>{item.rotulo}</span>
                  </div>
                  {item.emBreve && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-verde-menta text-texto-apoio">
                      Em breve
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-verde-menta space-y-3">
            <Botao
              variant="secondary"
              onClick={() => {
                setMenuMobileAberto(false)
                setModalJamesAberto(true)
              }}
              className="w-full justify-center text-xs h-10 border-dourado text-texto-principal bg-dourado/10"
            >
              <Sparkles className="h-4 w-4 text-dourado" />
              <span>Conhecer as 5 Leis do James</span>
            </Botao>

            <Botao
              variant="secondary"
              onClick={handleLogout}
              carregando={saindo}
              className="w-full justify-center text-xs h-10 border-vermelho-suave/30 text-vermelho-suave hover:bg-vermelho-suave/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da conta</span>
            </Botao>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CONTEÚDO PRINCIPAL (12 Colunas)                       */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top bar com saudação acolhedora */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-verde-menta px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-base sm:text-lg text-verde-floresta">
              {saudacao}
            </h2>
            <p className="text-xs text-texto-apoio flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-verde-sucesso inline" />
              <span>{JAMES_MICROCOPY.feedbackIncentivo}</span>
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="block text-xs font-semibold text-texto-principal">
                {nomeUsuario}
              </span>
              <span className="block text-[11px] text-texto-apoio">Sessão segura ativa</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-verde-menta text-verde-floresta font-bold flex items-center justify-center border border-verde-sage/40">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Área de conteúdo das rotas filhas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ======================================================== */}
      {/* 5. NAVEGAÇÃO INFERIOR FIXA (MOBILE <768px)               */}
      {/* ======================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-verde-menta px-3 py-2 flex items-center justify-around shadow-lg">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium ${
              isActive ? 'text-verde-floresta font-bold' : 'text-texto-apoio'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>

        <button
          onClick={() => setModalJamesAberto(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium text-texto-apoio hover:text-verde-floresta"
        >
          <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-dourado to-verde-sage flex items-center justify-center text-white">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <span className="text-dourado font-semibold">James</span>
        </button>

        <button
          onClick={() => setMenuMobileAberto(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium text-texto-apoio hover:text-verde-floresta"
        >
          <Menu className="h-5 w-5" />
          <span>Mais</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL: PERSONALIDADE E 5 LEIS DO JAMES                   */}
      {/* ======================================================== */}
      <Modal
        aberto={modalJamesAberto}
        aoFechar={() => setModalJamesAberto(false)}
        titulo="Assistente James — Princípios e 5 Leis Éticas"
        descricao="Compromisso ético, transparência absoluta e segurança para suas finanças."
        tamanho="lg"
        rodape={<Botao onClick={() => setModalJamesAberto(false)}>Entendido, obrigado James</Botao>}
      >
        <div className="space-y-4 text-sm text-texto-principal">
          {/* Card do James */}
          <div className="rounded-xl bg-gradient-to-r from-verde-menta to-verde-sage/30 p-4 border border-dourado/40 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-verde-floresta flex items-center justify-center text-white ring-2 ring-dourado shrink-0">
              <Bot className="h-6 w-6 text-dourado" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-verde-floresta">
                James • Seu Educador Financeiro
              </h4>
              <p className="text-xs text-texto-apoio mt-0.5">
                Tom: <strong className="text-texto-principal">{JAMES_TONE}</strong>. Cuidando com
                carinho do seu jardim financeiro.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h5 className="font-display font-semibold text-sm text-verde-floresta uppercase tracking-wide">
              As 5 Leis Éticas Invioláveis do James
            </h5>

            <div className="grid gap-2.5">
              <div className="p-3 rounded-xl bg-creme border border-verde-menta flex gap-3 items-start">
                <span className="h-6 w-6 rounded-full bg-verde-floresta text-white text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-texto-principal text-xs block mb-0.5">
                    Fidelidade aos Dados Reais
                  </strong>
                  <p className="text-xs text-texto-apoio">{JAMES_LEIS.lei1}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-creme border border-verde-menta flex gap-3 items-start">
                <span className="h-6 w-6 rounded-full bg-verde-floresta text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-texto-principal text-xs block mb-0.5">
                    Ação Prática Obrigatória
                  </strong>
                  <p className="text-xs text-texto-apoio">{JAMES_LEIS.lei2}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-creme border border-verde-menta flex gap-3 items-start">
                <span className="h-6 w-6 rounded-full bg-verde-floresta text-white text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-texto-principal text-xs block mb-0.5">
                    Sem Culpa e Sem Falsas Promessas
                  </strong>
                  <p className="text-xs text-texto-apoio">{JAMES_LEIS.lei3}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-creme border border-verde-menta flex gap-3 items-start">
                <span className="h-6 w-6 rounded-full bg-verde-floresta text-white text-xs font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-texto-principal text-xs block mb-0.5">
                    Papel Educacional & Recomendação Especializada
                  </strong>
                  <p className="text-xs text-texto-apoio">{JAMES_LEIS.lei4}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-creme border border-verde-menta flex gap-3 items-start">
                <span className="h-6 w-6 rounded-full bg-verde-floresta text-white text-xs font-bold flex items-center justify-center shrink-0">
                  5
                </span>
                <div>
                  <strong className="text-texto-principal text-xs block mb-0.5">
                    Educador e Organizador, Não Consultor CVM
                  </strong>
                  <p className="text-xs text-texto-apoio">{JAMES_LEIS.lei5}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
