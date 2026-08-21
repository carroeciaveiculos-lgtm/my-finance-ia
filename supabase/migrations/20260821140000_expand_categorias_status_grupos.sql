-- Migration: 0016_expand_categorias_status_grupos.sql
-- Description: Ampliação de categorias padrão (despesas e receitas) e criação de tabelas de status e grupos com RLS e FKs em contas

-- 1. Criação da tabela status
CREATE TABLE IF NOT EXISTS public.status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_user_id ON public.status(user_id);

ALTER TABLE public.status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status_select" ON public.status;
CREATE POLICY "status_select" ON public.status
  FOR SELECT TO authenticated
  USING ((user_id IS NULL) OR (user_id = auth.uid()));

DROP POLICY IF EXISTS "status_insert" ON public.status;
CREATE POLICY "status_insert" ON public.status
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "status_update" ON public.status;
CREATE POLICY "status_update" ON public.status
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "status_delete" ON public.status;
CREATE POLICY "status_delete" ON public.status
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- 2. Criação da tabela grupos
CREATE TABLE IF NOT EXISTS public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grupos_user_id ON public.grupos(user_id);

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grupos_select" ON public.grupos;
CREATE POLICY "grupos_select" ON public.grupos
  FOR SELECT TO authenticated
  USING ((user_id IS NULL) OR (user_id = auth.uid()));

DROP POLICY IF EXISTS "grupos_insert" ON public.grupos;
CREATE POLICY "grupos_insert" ON public.grupos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "grupos_update" ON public.grupos;
CREATE POLICY "grupos_update" ON public.grupos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "grupos_delete" ON public.grupos;
CREATE POLICY "grupos_delete" ON public.grupos
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- 3. Adicionar status_id e grupo_id na tabela contas
ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES public.status(id) ON DELETE SET NULL;
ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contas_status_id ON public.contas(status_id);
CREATE INDEX IF NOT EXISTS idx_contas_grupo_id ON public.contas(grupo_id);


-- 4. Seed de Status do Sistema (user_id NULL)
INSERT INTO public.status (id, user_id, nome, cor)
VALUES
  ('a1111111-1111-4111-a111-111111111111'::uuid, NULL, 'Ativa', '#2E8B57'),
  ('a2222222-2222-4222-a222-222222222222'::uuid, NULL, 'Inativa', '#9CA3AF'),
  ('a3333333-3333-4333-a333-333333333333'::uuid, NULL, 'Cancelada', '#C0392B'),
  ('a4444444-4444-4444-a444-444444444444'::uuid, NULL, 'Pausada', '#D4A853')
ON CONFLICT (id) DO NOTHING;


-- 5. Seed de Grupos do Sistema (user_id NULL)
INSERT INTO public.grupos (id, user_id, nome, cor)
VALUES
  ('b1111111-1111-4111-b111-111111111111'::uuid, NULL, 'Dia a Dia', '#3B82F6'),
  ('b2222222-2222-4222-b222-222222222222'::uuid, NULL, 'Reservas', '#2E8B57'),
  ('b3333333-3333-4333-b333-333333333333'::uuid, NULL, 'Investimentos', '#8B5CF6'),
  ('b4444444-4444-4444-b444-444444444444'::uuid, NULL, 'Cartões de Crédito', '#EF4444')
ON CONFLICT (id) DO NOTHING;


-- 6. Seed e Ampliação Completa de Categorias (Despesa e Receita)
DO $$
DECLARE
  v_pai_id uuid;

  -- Helper function inline logic via loop or blocks
BEGIN

  -- ==========================================
  -- DESPESAS
  -- ==========================================

  -- 1. Moradia
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Moradia';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Moradia', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Aluguel / Financiamento'),
    ('Condomínio'),
    ('IPTU / Impostos'),
    ('Contas de Casa (água, luz, gás)'),
    ('Internet / Telefone'),
    ('Manutenção & Reformas'),
    ('Seguro Residencial'),
    ('Móveis & Eletrodomésticos')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 2. Alimentação
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Alimentação';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Alimentação', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Supermercado'),
    ('Feira & Hortifruti'),
    ('Padaria'),
    ('Restaurante'),
    ('Delivery & Lanches'),
    ('Café & Lanchonete')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 3. Transporte
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Transporte';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Transporte', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Combustível'),
    ('Uber & Aplicativos'),
    ('Transporte Público'),
    ('Estacionamento & Pedágio'),
    ('Manutenção do Veículo'),
    ('Seguro do Veículo'),
    ('IPVA / Licenciamento')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 4. Saúde
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Saúde';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Saúde', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Plano de Saúde'),
    ('Consultas & Exames'),
    ('Farmácia & Remédios'),
    ('Dentista'),
    ('Academia & Exercícios'),
    ('Terapias & Psicólogo')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 5. Educação
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Educação';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Educação', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Cursos & Treinamentos'),
    ('Mensalidade Escolar'),
    ('Livros & Material Didático'),
    ('Cursos Online')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 6. Lazer & Entretenimento
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND (nome = 'Lazer & Entretenimento' OR nome = 'Lazer');
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Lazer & Entretenimento', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  ELSE
    UPDATE public.categorias SET nome = 'Lazer & Entretenimento' WHERE id = v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Cinema & Streaming'),
    ('Viagens & Passeios'),
    ('Restaurantes & Bares'),
    ('Eventos & Shows'),
    ('Hobbies'),
    ('Assinaturas & Apps')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 7. Vestuário
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Vestuário';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Vestuário', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Roupas'),
    ('Calçados'),
    ('Acessórios')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 8. Cuidados Pessoais
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Cuidados Pessoais';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Cuidados Pessoais', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Salão & Barbearia'),
    ('Cosméticos'),
    ('Perfumaria')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 9. Pets (NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Pets';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Pets', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Ração'),
    ('Veterinário'),
    ('Pet Shop & Acessórios')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 10. Compras & Varejo (NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Compras & Varejo';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Compras & Varejo', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('E-commerce'),
    ('Mercado Livre / Amazon'),
    ('Lojas Físicas')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 11. Serviços & Assinaturas (NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Serviços & Assinaturas';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Serviços & Assinaturas', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Streaming (Netflix, Spotify, etc.)'),
    ('Aplicativos'),
    ('Serviços de Assinatura')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 12. Tarifas & Impostos (NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Tarifas & Impostos';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Tarifas & Impostos', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Tarifas Bancárias'),
    ('Impostos'),
    ('Multas & Juros'),
    ('Imposto de Renda')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 13. Investimentos & Aportes
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Investimentos & Aportes';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Investimentos & Aportes', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Aporte Renda Fixa'),
    ('Aporte Renda Variável'),
    ('Reserva de Emergência'),
    ('Previdência')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 14. Transferências (despesa - NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Transferências';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Transferências', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Entre contas'),
    ('Para terceiros')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );

  -- 15. Outros (despesa)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'despesa' AND nome = 'Outros';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Outros', 'despesa', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'despesa', v_pai_id
  FROM (VALUES
    ('Gastos diversos'),
    ('Presentes & Doações')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'despesa' AND nome = item.nome
  );


  -- ==========================================
  -- RECEITAS
  -- ==========================================

  -- 1. Renda
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'receita' AND nome = 'Renda';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Renda', 'receita', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'receita', v_pai_id
  FROM (VALUES
    ('Salário'),
    ('Pró-labore'),
    ('Freelance & Projetos'),
    ('Comissões & Vendas'),
    ('Rendimentos & Dividendos'),
    ('Outras Receitas')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'receita' AND nome = item.nome
  );

  -- 2. Renda Extra (NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'receita' AND nome = 'Renda Extra';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Renda Extra', 'receita', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'receita', v_pai_id
  FROM (VALUES
    ('Bônus & Premiações'),
    ('Reembolsos'),
    ('Vendas de Itens Usados'),
    ('Cashback')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'receita' AND nome = item.nome
  );

  -- 3. Investimentos (receita - NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'receita' AND nome = 'Investimentos';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Investimentos', 'receita', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'receita', v_pai_id
  FROM (VALUES
    ('Rendimentos de Renda Fixa'),
    ('Dividendos'),
    ('Juros')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'receita' AND nome = item.nome
  );

  -- 4. Transferências Recebidas (receita - NOVA categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'receita' AND nome = 'Transferências Recebidas';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Transferências Recebidas', 'receita', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'receita', v_pai_id
  FROM (VALUES
    ('Entre contas'),
    ('De terceiros')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'receita' AND nome = item.nome
  );

  -- 5. Outras Receitas (receita - categoria principal)
  SELECT id INTO v_pai_id FROM public.categorias WHERE categoria_pai_id IS NULL AND tipo = 'receita' AND nome = 'Outras Receitas';
  IF v_pai_id IS NULL THEN
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (gen_random_uuid(), NULL, 'Outras Receitas', 'receita', NULL)
    RETURNING id INTO v_pai_id;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, item.nome, 'receita', v_pai_id
  FROM (VALUES
    ('Presentes'),
    ('Outros')
  ) AS item(nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias
    WHERE categoria_pai_id = v_pai_id AND tipo = 'receita' AND nome = item.nome
  );

END $$;
