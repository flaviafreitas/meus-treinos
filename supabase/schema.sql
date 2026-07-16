-- ============================================================
--  Meus Treinos — configuração do banco no Supabase
--  Cole tudo isso no SQL Editor do Supabase e clique em "Run".
--  (Painel do Supabase -> SQL Editor -> New query)
-- ============================================================

-- 1) Tabela de ROTINAS -------------------------------------------------
create table if not exists public.rotinas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  nome       text not null,
  created_at timestamptz not null default now()
);

-- 2) Tabela de EXERCÍCIOS ---------------------------------------------
create table if not exists public.exercicios (
  id          uuid primary key default gen_random_uuid(),
  rotina_id   uuid not null references public.rotinas (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  nome        text not null,
  foto_url    text,
  series      integer,
  repeticoes  text,
  observacoes text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_exercicios_rotina on public.exercicios (rotina_id);

create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  routine_id   uuid references public.rotinas (id) on delete set null,
  routine_name text not null,
  exercises    integer not null default 0,
  sets         integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_sessions_user on public.sessions (user_id, created_at desc);

-- Ordem manual dos exercícios (arrastar e soltar na página do treino).
alter table public.exercicios add column if not exists posicao integer;

-- Backfill: numera os exercícios existentes por rotina na ordem de criação.
update public.exercicios e
set posicao = sub.rn
from (
  select id,
         row_number() over (partition by rotina_id order by created_at) - 1 as rn
  from public.exercicios
) sub
where e.id = sub.id and e.posicao is null;

-- 3) Segurança: cada pessoa só acessa os PRÓPRIOS dados ---------------
alter table public.rotinas    enable row level security;
alter table public.exercicios enable row level security;
alter table public.sessions   enable row level security;

-- Rotinas: dono pode tudo
drop policy if exists "rotinas do dono" on public.rotinas;
create policy "rotinas do dono" on public.rotinas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Exercícios: dono pode tudo
drop policy if exists "exercicios do dono" on public.exercicios;
create policy "exercicios do dono" on public.exercicios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sessions user" on public.sessions;
create policy "sessions user" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Storage: bucket público para as FOTOS ----------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode VER as fotos (leitura pública)
drop policy if exists "fotos leitura publica" on storage.objects;
create policy "fotos leitura publica" on storage.objects
  for select using (bucket_id = 'fotos');

-- Só usuários logados podem ENVIAR fotos, dentro da própria pasta (user_id/...)
drop policy if exists "fotos upload do dono" on storage.objects;
create policy "fotos upload do dono" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Dono pode atualizar/remover as próprias fotos
drop policy if exists "fotos update do dono" on storage.objects;
create policy "fotos update do dono" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fotos delete do dono" on storage.objects;
create policy "fotos delete do dono" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
