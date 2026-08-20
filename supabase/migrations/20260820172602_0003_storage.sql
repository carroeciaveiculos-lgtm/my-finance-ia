-- Migração 0003: Storage bucket "extratos" privado e políticas de acesso
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('extratos', 'extratos', false, 10485760, ARRAY['application/pdf', 'text/csv', 'application/x-ofx', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Políticas de Storage para o bucket extratos
DROP POLICY IF EXISTS "Usuário faz upload de extratos em sua pasta" ON storage.objects;
CREATE POLICY "Usuário faz upload de extratos em sua pasta"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'extratos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuário lê extratos de sua pasta" ON storage.objects;
CREATE POLICY "Usuário lê extratos de sua pasta"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'extratos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuário atualiza extratos de sua pasta" ON storage.objects;
CREATE POLICY "Usuário atualiza extratos de sua pasta"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'extratos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuário deleta extratos de sua pasta" ON storage.objects;
CREATE POLICY "Usuário deleta extratos de sua pasta"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'extratos' AND (storage.foldername(name))[1] = auth.uid()::text);
