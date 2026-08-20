-- Migração 0011: Criação das tabelas metas, dividas e investimentos
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_objetivo NUMERIC NOT NULL,
  valor_atual NUMERIC NOT NULL DEFAULT 0,
  data_limite DATE,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metas_user_id ON public.metas(user_id);
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas_select" ON public.metas;
CREATE POLICY "metas_select" ON public.metas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "metas_insert" ON public.metas;
CREATE POLICY "metas_insert" ON public.metas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "metas_update" ON public.metas;
CREATE POLICY "metas_update" ON public.metas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "metas_delete" ON public.metas;
CREATE POLICY "metas_delete" ON public.metas
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Tabela dividas
CREATE TABLE IF NOT EXISTS public.dividas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  taxa_juros NUMERIC,
  parcelas_total INT,
  parcelas_pagas INT NOT NULL DEFAULT 0,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dividas_user_id ON public.dividas(user_id);
ALTER TABLE public.dividas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dividas_select" ON public.dividas;
CREATE POLICY "dividas_select" ON public.dividas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dividas_insert" ON public.dividas;
CREATE POLICY "dividas_insert" ON public.dividas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dividas_update" ON public.dividas;
CREATE POLICY "dividas_update" ON public.dividas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dividas_delete" ON public.dividas;
CREATE POLICY "dividas_delete" ON public.dividas
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Tabela investimentos
CREATE TABLE IF NOT EXISTS public.investimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  valor_aplicado NUMERIC NOT NULL,
  valor_atual NUMERIC NOT NULL,
  data_aplicacao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investimentos_user_id ON public.investimentos(user_id);
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investimentos_select" ON public.investimentos;
CREATE POLICY "investimentos_select" ON public.investimentos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "investimentos_insert" ON public.investimentos;
CREATE POLICY "investimentos_insert" ON public.investimentos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "investimentos_update" ON public.investimentos;
CREATE POLICY "investimentos_update" ON public.investimentos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "investimentos_delete" ON public.investimentos;
CREATE POLICY "investimentos_delete" ON public.investimentos
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
