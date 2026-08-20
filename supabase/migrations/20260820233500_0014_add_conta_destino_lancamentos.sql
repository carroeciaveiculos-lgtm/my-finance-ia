-- Migration: Adicionar conta_destino_id na tabela lancamentos para transferências
ALTER TABLE public.lancamentos
ADD COLUMN IF NOT EXISTS conta_destino_id UUID REFERENCES public.contas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_destino_id ON public.lancamentos(conta_destino_id);

-- Atualiza políticas de RLS para garantir integridade caso necessário
DROP POLICY IF EXISTS "lancamentos_select" ON public.lancamentos;
CREATE POLICY "lancamentos_select" ON public.lancamentos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lancamentos_insert" ON public.lancamentos;
CREATE POLICY "lancamentos_insert" ON public.lancamentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lancamentos_update" ON public.lancamentos;
CREATE POLICY "lancamentos_update" ON public.lancamentos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lancamentos_delete" ON public.lancamentos;
CREATE POLICY "lancamentos_delete" ON public.lancamentos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
