-- 1. Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  plan TEXT DEFAULT 'free',
  docs_this_month INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Criar tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  signature_data TEXT,
  file_url TEXT,
  content TEXT,
  signer_email TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Garantir que as colunas novas existam caso a tabela já tenha sido criada anteriormente
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signer_email TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Perfis
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Sistema pode inserir perfis" ON profiles;
CREATE POLICY "Sistema pode inserir perfis" 
ON profiles FOR INSERT 
WITH CHECK (true);

-- 5. Políticas para Documentos
DROP POLICY IF EXISTS "Usuários podem ver seus próprios documentos ou os que devem assinar" ON documents;
CREATE POLICY "Usuários podem ver seus próprios documentos ou os que devem assinar" 
ON documents FOR SELECT 
USING (auth.uid() = owner_id OR signer_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios documentos" ON documents;
CREATE POLICY "Usuários podem inserir seus próprios documentos" 
ON documents FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios documentos ou os que devem assinar" ON documents;
CREATE POLICY "Usuários podem atualizar seus próprios documentos ou os que devem assinar" 
ON documents FOR UPDATE 
USING (auth.uid() = owner_id OR signer_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios documentos" ON documents;
CREATE POLICY "Usuários podem deletar seus próprios documentos" 
ON documents FOR DELETE 
USING (auth.uid() = owner_id);
