import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AuthProvider } from '@/hooks/use-auth'

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  process.env.VITE_SUPABASE_URL ||
  'https://vnvoobfuslxthhyvojka.supabase.co'
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''

describe('Testes Reais de Autenticação com Supabase', () => {
  let supabase: SupabaseClient
  const testTimestamp = Date.now()
  const testEmail = `teste.vitest.${testTimestamp}@myfinanceia.local`
  const testPassword = 'Senha@Teste123'
  let testUserId: string | null = null

  beforeAll(() => {
    expect(supabaseUrl).toBeTruthy()
    expect(supabaseAnonKey).toBeTruthy()
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  })

  afterAll(async () => {
    // Garante signOut no final dos testes
    if (supabase) {
      await supabase.auth.signOut()
    }
  })

  it('1. Teste de cadastro: cria um usuário via supabase.auth.signUp e retorna session ou user sem erro', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: 'Usuário Vitest Efêmero',
        },
      },
    })

    expect(error).toBeNull()
    expect(data.user).toBeDefined()
    expect(data.user?.email).toBe(testEmail)
    testUserId = data.user?.id || null
    expect(testUserId).toBeTruthy()
  })

  it('2. Teste de login: autentica com supabase.auth.signInWithPassword e retorna session válida', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    expect(error).toBeNull()
    expect(data.session).toBeDefined()
    expect(data.session?.access_token).toBeTruthy()
    expect(data.user?.email).toBe(testEmail)
  })

  it('3. Teste de logout: executa supabase.auth.signOut e verifica que a sessão vira null', async () => {
    const { error } = await supabase.auth.signOut()
    expect(error).toBeNull()

    const { data } = await supabase.auth.getSession()
    expect(data.session).toBeNull()
  })

  it('4. Teste de redirecionamento: ProtectedRoute redireciona para /login quando não há sessão', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Tela de Login de Teste</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Conteúdo Protegido do Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    // Como getSession resolve para null, o ProtectedRoute deve renderizar /login ou carregando
    const loginText = await screen.findByText('Tela de Login de Teste')
    expect(loginText).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo Protegido do Dashboard')).toBeNull()
  })
})
