-- Migração 0009: Criação da tabela lancamentos
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  subcategoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  conta_id UUID REFERENCES public.contas(id) ON DELETE SET NULL,
  documento_id UUID REFERENCES public.documentos_importados(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para lancamentos
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id ON public.lancamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON public.lancamentos(data);
CREATE INDEX IF NOT EXISTS idx_lancamentos_categoria_id ON public.lancamentos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_subcategoria_id ON public.lancamentos(subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_id ON public.lancamentos(conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_documento_id ON public.lancamentos(documento_id);

-- Ativa RLS
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para lancamentos
DROP POLICY IF EXISTS "lancamentos_select" ON public.lancamentos;
CREATE POLICY "lancamentos_select" ON public.lancamentos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lancamentos_insert" ON public.lancamentos;
CREATE POLICY "lancamentos_insert" ON public.lancamentos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lancamentos_update" ON public.lancamentos;
CREATE POLICY "lancamentos_update" ON public.lancamentos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lancamentos_delete" ON public.lancamentos;
CREATE POLICY "lancamentos_delete" ON public.lancamentos
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
