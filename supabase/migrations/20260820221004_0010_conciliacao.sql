-- Migração 0010: Criação da tabela conciliacao
CREATE TABLE IF NOT EXISTS public.conciliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  documento_id UUID REFERENCES public.documentos_importados(id) ON DELETE CASCADE,
  lancamento_id UUID REFERENCES public.lancamentos(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('correspondido', 'nao_correspondido', 'divergente', 'revisao')),
  data_correspondencia TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para conciliacao
CREATE INDEX IF NOT EXISTS idx_conciliacao_user_id ON public.conciliacao(user_id);
CREATE INDEX IF NOT EXISTS idx_conciliacao_documento_id ON public.conciliacao(documento_id);
CREATE INDEX IF NOT EXISTS idx_conciliacao_lancamento_id ON public.conciliacao(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_conciliacao_status ON public.conciliacao(status);

-- Ativa RLS
ALTER TABLE public.conciliacao ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para conciliacao
DROP POLICY IF EXISTS "conciliacao_select" ON public.conciliacao;
CREATE POLICY "conciliacao_select" ON public.conciliacao
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "conciliacao_insert" ON public.conciliacao;
CREATE POLICY "conciliacao_insert" ON public.conciliacao
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "conciliacao_update" ON public.conciliacao;
CREATE POLICY "conciliacao_update" ON public.conciliacao
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "conciliacao_delete" ON public.conciliacao;
CREATE POLICY "conciliacao_delete" ON public.conciliacao
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
