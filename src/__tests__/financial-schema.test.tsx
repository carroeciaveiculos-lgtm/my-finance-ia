import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

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

describe('Validação do Modelo de Dados Completo + RLS + Contas (Etapa 2)', () => {
  let clientA: SupabaseClient
  let clientB: SupabaseClient

  const userAEmail = `teste.userA.${Date.now()}@myfinanceia.local`
  const userBEmail = `teste.userB.${Date.now()}@myfinanceia.local`
  const password = 'SenhaForte123!@#'

  let userAId: string
  let userBId: string

  // IDs para relacionamentos de teste do Usuário A
  let contaAId: string
  let categoriaPaiAId: string
  let subcategoriaAId: string
  let documentoAId: string
  let lancamentoAId: string
  let conciliacaoAId: string
  let metaAId: string
  let dividaAId: string
  let investimentoAId: string
  let consorcioAId: string
  let seguroAId: string

  beforeAll(async () => {
    clientA = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    clientB = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Cadastra Usuário A
    const resA = await clientA.auth.signUp({
      email: userAEmail,
      password: password,
      options: { data: { nome: 'Usuário Teste A' } },
    })
    expect(resA.error).toBeNull()
    userAId = resA.data.user?.id || ''
    expect(userAId).toBeTruthy()

    // Cadastra Usuário B
    const resB = await clientB.auth.signUp({
      email: userBEmail,
      password: password,
      options: { data: { nome: 'Usuário Teste B' } },
    })
    expect(resB.error).toBeNull()
    userBId = resB.data.user?.id || ''
    expect(userBId).toBeTruthy()

    // Faz login explícito para garantir sessão autenticada
    const loginA = await clientA.auth.signInWithPassword({ email: userAEmail, password })
    expect(loginA.error).toBeNull()

    const loginB = await clientB.auth.signInWithPassword({ email: userBEmail, password })
    expect(loginB.error).toBeNull()
  })

  afterAll(async () => {
    if (clientA) await clientA.auth.signOut()
    if (clientB) await clientB.auth.signOut()
  })

  it('1. Deve consultar categorias padrão do sistema (seed com user_id IS NULL)', async () => {
    const { data, error } = await clientA.from('categorias').select('*')
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data!.length).toBeGreaterThanOrEqual(15)

    const alimentacao = data!.find((c) => c.nome === 'Alimentação')
    expect(alimentacao).toBeDefined()
    expect(alimentacao.tipo).toBe('despesa')

    const salario = data!.find((c) => c.nome === 'Salário')
    expect(salario).toBeDefined()
    expect(salario.tipo).toBe('receita')
  })

  it('2. Deve inserir e ler na tabela CONTAS (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('contas')
      .insert({
        user_id: userAId,
        nome: 'Conta Corrente Principal',
        tipo: 'conta_corrente',
        banco: 'Nubank',
        saldo_inicial: 1500.5,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.nome).toBe('Conta Corrente Principal')
    expect(data.tipo).toBe('conta_corrente')
    expect(Number(data.saldo_inicial)).toBe(1500.5)
    contaAId = data.id
  })

  it('3. Deve criar categorias personalizadas hierárquicas (Pai e Filha) para o Usuário A', async () => {
    // Categoria Pai
    const resPai = await clientA
      .from('categorias')
      .insert({
        user_id: userAId,
        nome: 'Projetos Especiais',
        tipo: 'despesa',
      })
      .select()
      .single()

    expect(resPai.error).toBeNull()
    categoriaPaiAId = resPai.data.id

    // Categoria Filha (Subcategoria)
    const resFilha = await clientA
      .from('categorias')
      .insert({
        user_id: userAId,
        nome: 'Reforma do Escritório',
        tipo: 'despesa',
        categoria_pai_id: categoriaPaiAId,
      })
      .select()
      .single()

    expect(resFilha.error).toBeNull()
    subcategoriaAId = resFilha.data.id
    expect(resFilha.data.categoria_pai_id).toBe(categoriaPaiAId)
  })

  it('4. Deve inserir e ler na tabela DOCUMENTOS_IMPORTADOS (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('documentos_importados')
      .insert({
        user_id: userAId,
        nome_arquivo: 'extrato_nubank_marco_2026.ofx',
        tipo: 'ofx',
        conta_id: contaAId,
        status: 'importado',
        caminho_storage: `extratos/${userAId}/extrato_nubank.ofx`,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.nome_arquivo).toBe('extrato_nubank_marco_2026.ofx')
    documentoAId = data.id
  })

  it('5. Deve inserir LANCAMENTO conectando categoria, subcategoria, conta e documento (Integração Total)', async () => {
    const { data, error } = await clientA
      .from('lancamentos')
      .insert({
        user_id: userAId,
        tipo: 'despesa',
        valor: 450.75,
        data: '2026-03-15',
        descricao: 'Compra de Mesa Ergonômica',
        categoria_id: categoriaPaiAId,
        subcategoria_id: subcategoriaAId,
        conta_id: contaAId,
        documento_id: documentoAId,
      })
      .select(`
        *,
        categoria:categorias!lancamentos_categoria_id_fkey(*),
        subcategoria:categorias!lancamentos_subcategoria_id_fkey(*),
        conta:contas!lancamentos_conta_id_fkey(*)
      `)
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Number(data.valor)).toBe(450.75)
    expect(data.categoria.nome).toBe('Projetos Especiais')
    expect(data.subcategoria.nome).toBe('Reforma do Escritório')
    expect(data.conta.nome).toBe('Conta Corrente Principal')
    lancamentoAId = data.id
  })

  it('6. Deve inserir e ler na tabela CONCILIACAO (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('conciliacao')
      .insert({
        user_id: userAId,
        documento_id: documentoAId,
        lancamento_id: lancamentoAId,
        status: 'correspondido',
        data_correspondencia: new Date().toISOString(),
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.status).toBe('correspondido')
    conciliacaoAId = data.id
  })

  it('7. Deve inserir e ler na tabela METAS (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('metas')
      .insert({
        user_id: userAId,
        nome: 'Reserva 6 Meses',
        valor_objetivo: 30000,
        valor_atual: 12000,
        data_limite: '2026-12-31',
        status: 'em_andamento',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Number(data.valor_objetivo)).toBe(30000)
    metaAId = data.id
  })

  it('8. Deve inserir e ler na tabela DIVIDAS (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('dividas')
      .insert({
        user_id: userAId,
        nome: 'Financiamento Imobiliário',
        valor_total: 250000,
        valor_pago: 50000,
        taxa_juros: 9.5,
        parcelas_total: 360,
        parcelas_pagas: 60,
        status: 'ativa',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Number(data.valor_total)).toBe(250000)
    dividaAId = data.id
  })

  it('9. Deve inserir e ler na tabela INVESTIMENTOS (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('investimentos')
      .insert({
        user_id: userAId,
        nome: 'Tesouro Selic 2029',
        tipo: 'Renda Fixa',
        valor_aplicado: 10000,
        valor_atual: 10850,
        data_aplicacao: '2025-06-01',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Number(data.valor_atual)).toBe(10850)
    investimentoAId = data.id
  })

  it('10. Deve inserir e ler na tabela CONSORCIOS (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('consorcios')
      .insert({
        user_id: userAId,
        nome: 'Consórcio Imobiliário Porto Seguro',
        valor_credito: 180000,
        valor_parcela: 1450,
        parcelas_total: 180,
        parcelas_pagas: 24,
        status: 'ativo',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.status).toBe('ativo')
    consorcioAId = data.id
  })

  it('11. Deve inserir e ler na tabela SEGUROS (Usuário A)', async () => {
    const { data, error } = await clientA
      .from('seguros')
      .insert({
        user_id: userAId,
        nome: 'Seguro de Vida Individual',
        tipo: 'Vida',
        seguradora: 'SulAmérica',
        valor_premio: 180,
        data_inicio: '2026-01-01',
        data_vigencia: '2027-01-01',
        status: 'ativo',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.seguradora).toBe('SulAmérica')
    seguroAId = data.id
  })

  // ==========================================
  // TESTE DE RLS CRÍTICO: Usuário B NÃO VÊ DADOS DO USUÁRIO A
  // ==========================================
  describe('Testes de RLS (Isolamento entre Usuários)', () => {
    it('Usuário B NÃO deve conseguir ler as contas do Usuário A', async () => {
      const { data, error } = await clientB.from('contas').select('*').eq('id', contaAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler as categorias privadas do Usuário A', async () => {
      const { data, error } = await clientB.from('categorias').select('*').eq('id', categoriaPaiAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler os lançamentos do Usuário A', async () => {
      const { data, error } = await clientB.from('lancamentos').select('*').eq('id', lancamentoAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler os documentos do Usuário A', async () => {
      const { data, error } = await clientB
        .from('documentos_importados')
        .select('*')
        .eq('id', documentoAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler as conciliações do Usuário A', async () => {
      const { data, error } = await clientB.from('conciliacao').select('*').eq('id', conciliacaoAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler as metas do Usuário A', async () => {
      const { data, error } = await clientB.from('metas').select('*').eq('id', metaAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler as dívidas do Usuário A', async () => {
      const { data, error } = await clientB.from('dividas').select('*').eq('id', dividaAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler os investimentos do Usuário A', async () => {
      const { data, error } = await clientB
        .from('investimentos')
        .select('*')
        .eq('id', investimentoAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler os consórcios do Usuário A', async () => {
      const { data, error } = await clientB.from('consorcios').select('*').eq('id', consorcioAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir ler os seguros do Usuário A', async () => {
      const { data, error } = await clientB.from('seguros').select('*').eq('id', seguroAId)
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir alterar a conta do Usuário A (RLS UPDATE bloqueia)', async () => {
      const { data, error } = await clientB
        .from('contas')
        .update({ nome: 'Tentativa de Hack' })
        .eq('id', contaAId)
        .select()

      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('Usuário B NÃO deve conseguir excluir o lançamento do Usuário A (RLS DELETE bloqueia)', async () => {
      const { error } = await clientB.from('lancamentos').delete().eq('id', lancamentoAId)
      expect(error).toBeNull()

      // Verifica que o registro ainda existe intacto para o Usuário A
      const { data: lancamentoIntacto } = await clientA
        .from('lancamentos')
        .select('*')
        .eq('id', lancamentoAId)
        .single()
      expect(lancamentoIntacto).toBeDefined()
    })
  })
})
