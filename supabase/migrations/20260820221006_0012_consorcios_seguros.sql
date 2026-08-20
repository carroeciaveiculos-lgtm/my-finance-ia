-- Migração 0012: Criação das tabelas consorcios e seguros
CREATE TABLE IF NOT EXISTS public.consorcios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_credito NUMERIC NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  parcelas_total INT NOT NULL,
  parcelas_pagas INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'contemplado', 'quitado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consorcios_user_id ON public.consorcios(user_id);
ALTER TABLE public.consorcios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consorcios_select" ON public.consorcios;
CREATE POLICY "consorcios_select" ON public.consorcios
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "consorcios_insert" ON public.consorcios;
CREATE POLICY "consorcios_insert" ON public.consorcios
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "consorcios_update" ON public.consorcios;
CREATE POLICY "consorcios_update" ON public.consorcios
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "consorcios_delete" ON public.consorcios;
CREATE POLICY "consorcios_delete" ON public.consorcios
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Tabela seguros
CREATE TABLE IF NOT EXISTS public.seguros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  seguradora TEXT,
  valor_premio NUMERIC,
  data_inicio DATE,
  data_vigencia DATE,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seguros_user_id ON public.seguros(user_id);
ALTER TABLE public.seguros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seguros_select" ON public.seguros;
CREATE POLICY "seguros_select" ON public.seguros
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "seguros_insert" ON public.seguros;
CREATE POLICY "seguros_insert" ON public.seguros
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "seguros_update" ON public.seguros;
CREATE POLICY "seguros_update" ON public.seguros
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "seguros_delete" ON public.seguros;
CREATE POLICY "seguros_delete" ON public.seguros
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
