-- Migração 0002: Row Level Security e Políticas em public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário lê próprio profile" ON public.profiles;
CREATE POLICY "Usuário lê próprio profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuário edita próprio profile" ON public.profiles;
CREATE POLICY "Usuário edita próprio profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuário insere próprio profile" ON public.profiles;
CREATE POLICY "Usuário insere próprio profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
