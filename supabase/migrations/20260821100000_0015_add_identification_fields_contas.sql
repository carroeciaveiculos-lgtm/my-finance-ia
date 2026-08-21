-- Migration 0015: Adicionar campos completos de identificação de Contas
-- Campos adicionais para conta bancária e cartão de crédito

ALTER TABLE public.contas
  ADD COLUMN IF NOT EXISTS numero_banco TEXT,
  ADD COLUMN IF NOT EXISTS agencia TEXT,
  ADD COLUMN IF NOT EXISTS agencia_digito TEXT,
  ADD COLUMN IF NOT EXISTS conta TEXT,
  ADD COLUMN IF NOT EXISTS conta_digito TEXT,
  ADD COLUMN IF NOT EXISTS bandeira TEXT,
  ADD COLUMN IF NOT EXISTS numero_cartao_final TEXT,
  ADD COLUMN IF NOT EXISTS validade TEXT,
  ADD COLUMN IF NOT EXISTS nome_impresso TEXT;

-- Atualizar/Garantir políticas RLS para a tabela contas
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
