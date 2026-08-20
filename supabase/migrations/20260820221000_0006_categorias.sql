-- Migração 0006: Criação da tabela de categorias (hierárquica)
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria_pai_id UUID REFERENCES public.categorias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON public.categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_categoria_pai_id ON public.categorias(categoria_pai_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON public.categorias(tipo);

-- Ativa RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para categorias (usuário acessa suas próprias categorias ou categorias padrão de sistema com user_id IS NULL)
DROP POLICY IF EXISTS "categorias_select" ON public.categorias;
CREATE POLICY "categorias_select" ON public.categorias
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "categorias_insert" ON public.categorias;
CREATE POLICY "categorias_insert" ON public.categorias
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "categorias_update" ON public.categorias;
CREATE POLICY "categorias_update" ON public.categorias
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "categorias_delete" ON public.categorias;
CREATE POLICY "categorias_delete" ON public.categorias
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
