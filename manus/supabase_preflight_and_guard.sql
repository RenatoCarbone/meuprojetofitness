-- MiPlanFit — validação e proteção da tabela public.planos
-- Execute no SQL Editor do Supabase como administrador.
-- Este arquivo NÃO cria nenhuma política de RLS, pois o painel atual consulta todos os usuários diretamente do navegador.
-- Migre essa consulta para uma Edge Function antes de ativar RLS no painel.

-- 1) Pré-verificação: user_id precisa ser PK ou UNIQUE para onConflict: 'user_id'.
select
  c.conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
from pg_constraint c
where c.conrelid = 'public.planos'::regclass
  and c.contype in ('p', 'u');

-- 2) Inventário dos registros legados que precisam concluir novamente o quiz.
-- Não invente peso/idade: esses dados devem ser recolhidos do próprio usuário.
select
  user_id,
  user_email,
  user_name,
  created_at,
  updated_at,
  perfil
from public.planos
where perfil is null
   or jsonb_typeof(perfil) <> 'object'
   or perfil = '{}'::jsonb
order by updated_at desc nulls last;

-- 3) Diagnóstico de RLS. Guarde o resultado antes de mudar permissões.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'planos';

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'planos'
order by policyname;

-- 4) Proteção de integridade. Rode APENAS depois de confirmar no passo 1
-- que user_id é PRIMARY KEY ou UNIQUE. NOT VALID mantém registros antigos
-- intactos, mas bloqueia novos INSERT/UPDATE com perfil vazio.
alter table public.planos
  drop constraint if exists planos_perfil_objeto_nao_vazio;

alter table public.planos
  add constraint planos_perfil_objeto_nao_vazio
  check (
    perfil is not null
    and jsonb_typeof(perfil) = 'object'
    and perfil <> '{}'::jsonb
  ) not valid;

-- 5) Depois de todos os perfis legados terem sido recuperados pelo novo fluxo,
-- valide definitivamente a restrição:
-- alter table public.planos validate constraint planos_perfil_objeto_nao_vazio;

-- Segurança importante:
-- O painel atual contém um PIN no JavaScript e faz select('*') de planos no cliente.
-- Não habilite RLS com uma política permissiva para manter o painel funcionando.
-- Primeiro mova a leitura administrativa para uma Edge Function/servidor que use
-- credenciais de serviço apenas no backend; em seguida aplique políticas por user_id.
