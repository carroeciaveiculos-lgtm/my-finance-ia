import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

// Páginas Principais
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import ContasPage from './pages/Contas'
import LancamentosPage from './pages/Lancamentos'
import ImportacaoPage from './pages/Importacao'
import ModuloEmBreve from './pages/ModuloEmBreve'
import NotFound from './pages/NotFound'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Rotas Públicas de Autenticação */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Redirecionamento da Raiz para o Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Rotas Protegidas dentro do AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contas" element={<ContasPage />} />
              <Route path="/lancamentos" element={<LancamentosPage />} />
              <Route path="/importacao" element={<ImportacaoPage />} />
              <Route path="/extratos" element={<ImportacaoPage />} />
              <Route
                path="/metas"
                element={
                  <ModuloEmBreve
                    titulo="Metas Financeiras"
                    etapa="Etapa 5"
                    descricao="Definição de objetivos de curto, médio e longo prazo com acompanhamento visual."
                  />
                }
              />
              <Route
                path="/dividas"
                element={
                  <ModuloEmBreve
                    titulo="Dívidas, Consórcios e Seguros"
                    etapa="Etapa 6"
                    descricao="Mapeamento de passivos, taxas de juros, amortização e proteção patrimonial."
                  />
                }
              />
              <Route
                path="/investimentos"
                element={
                  <ModuloEmBreve
                    titulo="Carteira de Investimentos"
                    etapa="Etapa 6"
                    descricao="Acompanhamento de alocação de ativos e rentabilidade consolidada."
                  />
                }
              />
              <Route
                path="/conciliacao"
                element={
                  <ModuloEmBreve
                    titulo="Conciliação Bancária"
                    etapa="Etapa 7"
                    descricao="Confronto automático de alta precisão entre extratos e lançamentos."
                  />
                }
              />
              <Route
                path="/james"
                element={
                  <ModuloEmBreve
                    titulo="Assistente Inteligente James"
                    etapa="Etapa 8"
                    descricao="Interface conversacional inteligente com regras éticas anti-alucinação."
                  />
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ModuloEmBreve
                    titulo="Relatórios Analíticos"
                    etapa="Etapa 10"
                    descricao="Geração de demonstrativos, fluxo de caixa e evolução patrimonial."
                  />
                }
              />
            </Route>

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
