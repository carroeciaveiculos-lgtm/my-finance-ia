-- Migração 0004: Seed de usuários iniciais (Adriana Araújo e Luiz Fernando Araújo)
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_user3_id UUID;
BEGIN
  -- Usuário 1: Adriana Araújo (nutriadrianaaraujo22@gmail.com)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nutriadrianaaraujo22@gmail.com') THEN
    v_user1_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user1_id,
      '00000000-0000-0000-0000-000000000000',
      'nutriadrianaaraujo22@gmail.com',
      crypt('Luga94@@', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"nome": "Adriana Araújo", "name": "Adriana Araújo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, nome)
    VALUES (v_user1_id, 'nutriadrianaaraujo22@gmail.com', 'Adriana Araújo')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      nome = EXCLUDED.nome;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Luga94@@', gen_salt('bf')),
        raw_user_meta_data = '{"nome": "Adriana Araújo", "name": "Adriana Araújo"}',
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = 'nutriadrianaaraujo22@gmail.com';

    SELECT id INTO v_user1_id FROM auth.users WHERE email = 'nutriadrianaaraujo22@gmail.com';
    INSERT INTO public.profiles (id, email, nome)
    VALUES (v_user1_id, 'nutriadrianaaraujo22@gmail.com', 'Adriana Araújo')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      nome = EXCLUDED.nome;
  END IF;

  -- Usuário 2: Luiz Fernando Araújo (luizfernandora72@gmail.com)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'luizfernandora72@gmail.com') THEN
    v_user2_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user2_id,
      '00000000-0000-0000-0000-000000000000',
      'luizfernandora72@gmail.com',
      crypt('Luga94@@', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"nome": "Luiz Fernando Araújo", "name": "Luiz Fernando Araújo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, nome)
    VALUES (v_user2_id, 'luizfernandora72@gmail.com', 'Luiz Fernando Araújo')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      nome = EXCLUDED.nome;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Luga94@@', gen_salt('bf')),
        raw_user_meta_data = '{"nome": "Luiz Fernando Araújo", "name": "Luiz Fernando Araújo"}',
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = 'luizfernandora72@gmail.com';

    SELECT id INTO v_user2_id FROM auth.users WHERE email = 'luizfernandora72@gmail.com';
    INSERT INTO public.profiles (id, email, nome)
    VALUES (v_user2_id, 'luizfernandora72@gmail.com', 'Luiz Fernando Araújo')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      nome = EXCLUDED.nome;
  END IF;

END $$;
