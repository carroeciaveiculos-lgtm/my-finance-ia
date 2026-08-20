-- Migração 0005: Remover usuário não solicitado (adriana.araujo@kmzero.com.br)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Identifica o id do usuário caso exista
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br';

  IF v_user_id IS NOT NULL THEN
    -- Remove de public.profiles
    DELETE FROM public.profiles WHERE id = v_user_id;

    -- Remove de auth.users
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Também limpa da tabela public.profiles caso exista registro órfão pelo e-mail
  DELETE FROM public.profiles WHERE email = 'adriana.araujo@kmzero.com.br';
END $$;
