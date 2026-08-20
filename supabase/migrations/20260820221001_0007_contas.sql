-- Migração 0007: Criação da tabela contas
CREATE TABLE IF NOT EXISTS public.contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('conta_corrente', 'poupanca', 'cartao_credito', 'dinheiro', 'outro')),
  banco TEXT,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para contas
CREATE INDEX IF NOT EXISTS idx_contas_user_id ON public.contas(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_tipo ON public.contas(tipo);

-- Ativa RLS
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para contas (usuário acessa apenas as próprias contas)
DROP POLICY IF EXISTS "contas_select" ON public.contas;
CREATE POLICY "contas_select" ON public.contas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "contas_insert" ON public.contas;
CREATE POLICY "contas_insert" ON public.contas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "contas_update" ON public.contas;
CREATE POLICY "contas_update" ON public.contas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "contas_delete" ON public.contas;
CREATE POLICY "contas_delete" ON public.contas
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
