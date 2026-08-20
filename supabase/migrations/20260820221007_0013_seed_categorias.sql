-- Migração 0013: Seed de Categorias Padrão Hierárquicas
-- user_id = NULL para categorias globais do sistema disponíveis para todos os usuários
DO $$
DECLARE
  v_alim_id UUID;
  v_mora_id UUID;
  v_trans_id UUID;
  v_saude_id UUID;
  v_educ_id UUID;
  v_lazer_id UUID;
  v_renda_id UUID;
  v_inv_id UUID;
BEGIN
  -- 1. Alimentação (Despesa)
  SELECT id INTO v_alim_id FROM public.categorias WHERE nome = 'Alimentação' AND user_id IS NULL;
  IF v_alim_id IS NULL THEN
    v_alim_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_alim_id, NULL, 'Alimentação', 'despesa', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Supermercado', 'despesa', v_alim_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Supermercado' AND user_id IS NULL AND categoria_pai_id = v_alim_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Restaurante', 'despesa', v_alim_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Restaurante' AND user_id IS NULL AND categoria_pai_id = v_alim_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Delivery & Lanches', 'despesa', v_alim_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Delivery & Lanches' AND user_id IS NULL AND categoria_pai_id = v_alim_id);

  -- 2. Moradia (Despesa)
  SELECT id INTO v_mora_id FROM public.categorias WHERE nome = 'Moradia' AND user_id IS NULL;
  IF v_mora_id IS NULL THEN
    v_mora_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_mora_id, NULL, 'Moradia', 'despesa', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Aluguel / Financiamento', 'despesa', v_mora_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Aluguel / Financiamento' AND user_id IS NULL AND categoria_pai_id = v_mora_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Contas (Água, Luz, Gás, Internet)', 'despesa', v_mora_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Contas (Água, Luz, Gás, Internet)' AND user_id IS NULL AND categoria_pai_id = v_mora_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Manutenção & Casa', 'despesa', v_mora_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Manutenção & Casa' AND user_id IS NULL AND categoria_pai_id = v_mora_id);

  -- 3. Transporte (Despesa)
  SELECT id INTO v_trans_id FROM public.categorias WHERE nome = 'Transporte' AND user_id IS NULL;
  IF v_trans_id IS NULL THEN
    v_trans_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_trans_id, NULL, 'Transporte', 'despesa', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Combustível', 'despesa', v_trans_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Combustível' AND user_id IS NULL AND categoria_pai_id = v_trans_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Uber & Aplicativos', 'despesa', v_trans_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Uber & Aplicativos' AND user_id IS NULL AND categoria_pai_id = v_trans_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Estacionamento & Pedágio', 'despesa', v_trans_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Estacionamento & Pedágio' AND user_id IS NULL AND categoria_pai_id = v_trans_id);

  -- 4. Saúde (Despesa)
  SELECT id INTO v_saude_id FROM public.categorias WHERE nome = 'Saúde' AND user_id IS NULL;
  IF v_saude_id IS NULL THEN
    v_saude_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_saude_id, NULL, 'Saúde', 'despesa', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Farmácia & Remédios', 'despesa', v_saude_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Farmácia & Remédios' AND user_id IS NULL AND categoria_pai_id = v_saude_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Consultas & Exames', 'despesa', v_saude_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Consultas & Exames' AND user_id IS NULL AND categoria_pai_id = v_saude_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Plano de Saúde', 'despesa', v_saude_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Plano de Saúde' AND user_id IS NULL AND categoria_pai_id = v_saude_id);

  -- 5. Educação (Despesa)
  SELECT id INTO v_educ_id FROM public.categorias WHERE nome = 'Educação' AND user_id IS NULL;
  IF v_educ_id IS NULL THEN
    v_educ_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_educ_id, NULL, 'Educação', 'despesa', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Cursos & Treinamentos', 'despesa', v_educ_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Cursos & Treinamentos' AND user_id IS NULL AND categoria_pai_id = v_educ_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Livros & Material Didático', 'despesa', v_educ_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Livros & Material Didático' AND user_id IS NULL AND categoria_pai_id = v_educ_id);

  -- 6. Lazer (Despesa)
  SELECT id INTO v_lazer_id FROM public.categorias WHERE nome = 'Lazer' AND user_id IS NULL;
  IF v_lazer_id IS NULL THEN
    v_lazer_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_lazer_id, NULL, 'Lazer', 'despesa', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Viagens & Passeios', 'despesa', v_lazer_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Viagens & Passeios' AND user_id IS NULL AND categoria_pai_id = v_lazer_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Cinema & Streaming', 'despesa', v_lazer_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Cinema & Streaming' AND user_id IS NULL AND categoria_pai_id = v_lazer_id);

  -- 7. Renda (Receita)
  SELECT id INTO v_renda_id FROM public.categorias WHERE nome = 'Renda' AND user_id IS NULL;
  IF v_renda_id IS NULL THEN
    v_renda_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_renda_id, NULL, 'Renda', 'receita', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Salário', 'receita', v_renda_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Salário' AND user_id IS NULL AND categoria_pai_id = v_renda_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Freelance & Projetos', 'receita', v_renda_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Freelance & Projetos' AND user_id IS NULL AND categoria_pai_id = v_renda_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Rendimentos & Dividendos', 'receita', v_renda_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Rendimentos & Dividendos' AND user_id IS NULL AND categoria_pai_id = v_renda_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Outras Receitas', 'receita', v_renda_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Outras Receitas' AND user_id IS NULL AND categoria_pai_id = v_renda_id);

  -- 8. Investimentos & Reserva (Despesa/Aporte)
  SELECT id INTO v_inv_id FROM public.categorias WHERE nome = 'Investimentos & Aportes' AND user_id IS NULL;
  IF v_inv_id IS NULL THEN
    v_inv_id := gen_random_uuid();
    INSERT INTO public.categorias (id, user_id, nome, tipo, categoria_pai_id)
    VALUES (v_inv_id, NULL, 'Investimentos & Aportes', 'despesa', NULL);
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Reserva de Emergência', 'despesa', v_inv_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Reserva de Emergência' AND user_id IS NULL AND categoria_pai_id = v_inv_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Aporte Renda Fixa', 'despesa', v_inv_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Aporte Renda Fixa' AND user_id IS NULL AND categoria_pai_id = v_inv_id);

  INSERT INTO public.categorias (user_id, nome, tipo, categoria_pai_id)
  SELECT NULL, 'Aporte Renda Variável', 'despesa', v_inv_id
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE nome = 'Aporte Renda Variável' AND user_id IS NULL AND categoria_pai_id = v_inv_id);

END $$;
