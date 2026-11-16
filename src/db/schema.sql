drop table if exists public.song_playlists;
drop table if exists public.playlists;
drop table if exists public.songs;
drop table if exists public.profiles;

-- 1. Tabela pública de perfis
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text
);

alter table public.profiles enable row level security;

CREATE POLICY "Usuarios logados podem ler perfis"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuario atualiza proprio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Popula com usuários já existentes no Auth
insert into public.profiles (id, full_name, email)
select id, raw_user_meta_data->>'full_name', email
from auth.users
on conflict (id) do nothing;

-- Trigger para novos cadastros
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Suas tabelas (agora songs referencia public.profiles para permitir o join)
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  added_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null,
  album text
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null
);

create table public.song_playlists (
  song uuid not null references public.songs(id) on delete cascade,
  playlist uuid not null references public.playlists(id) on delete cascade,
  primary key (song, playlist)
);

-- 3. RLS e Políticas
alter table public.songs enable row level security;
alter table public.playlists enable row level security;
alter table public.song_playlists enable row level security;

CREATE POLICY "Usuarios logados podem ler musicas"
ON public.songs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios logados podem adicionar musicas"
ON public.songs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Usuario edita apenas proprias musicas"
ON public.songs FOR UPDATE
TO authenticated
USING (auth.uid() = added_by)
WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Usuario apaga apenas proprias musicas"
ON public.songs FOR DELETE
TO authenticated
USING (auth.uid() = added_by);

CREATE POLICY "Usuario le apenas proprias playlists"
ON public.playlists FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuario cria apenas proprias playlists"
ON public.playlists FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario edita apenas proprias playlists"
ON public.playlists FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario apaga apenas proprias playlists"
ON public.playlists FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuario le musicas das proprias playlists"
ON public.song_playlists FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = song_playlists.playlist
      AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Usuario adiciona musicas nas proprias playlists"
ON public.song_playlists FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = song_playlists.playlist
      AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Usuario remove musicas das proprias playlists"
ON public.song_playlists FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = song_playlists.playlist
      AND playlists.user_id = auth.uid()
  )
);