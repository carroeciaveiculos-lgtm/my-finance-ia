-- Migração 0008: Criação da tabela documentos_importados
CREATE TABLE IF NOT EXISTS public.documentos_importados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf', 'csv', 'xls', 'xlsx', 'ofx')),
  conta_id UUID REFERENCES public.contas(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('importado', 'processado', 'erro', 'nao_importado')),
  caminho_storage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para documentos_importados
CREATE INDEX IF NOT EXISTS idx_documentos_importados_user_id ON public.documentos_importados(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_importados_conta_id ON public.documentos_importados(conta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_importados_status ON public.documentos_importados(status);

-- Ativa RLS
ALTER TABLE public.documentos_importados ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para documentos_importados
DROP POLICY IF EXISTS "documentos_importados_select" ON public.documentos_importados;
CREATE POLICY "documentos_importados_select" ON public.documentos_importados
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "documentos_importados_insert" ON public.documentos_importados;
CREATE POLICY "documentos_importados_insert" ON public.documentos_importados
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "documentos_importados_update" ON public.documentos_importados;
CREATE POLICY "documentos_importados_update" ON public.documentos_importados
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "documentos_importados_delete" ON public.documentos_importados;
CREATE POLICY "documentos_importados_delete" ON public.documentos_importados
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
