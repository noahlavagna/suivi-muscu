-- Mode Duo : deux téléphones liés, chacun voit la séance de l'autre en direct
-- et peut lui laisser des mots d'encouragement.
--
-- À exécuter une fois dans Supabase → SQL Editor. Idempotent : peut être
-- relancé sans casser l'existant.

-- ── Le lien entre deux comptes ───────────────────────────────────────────────
-- `a` crée un code, `b` le saisit sur son téléphone (via join_duo).
create table if not exists public.duos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  a uuid not null default auth.uid() references auth.users on delete cascade,
  a_name text not null,
  b uuid references auth.users on delete cascade,
  b_name text,
  created_at timestamptz not null default now()
);
alter table public.duos enable row level security;

drop policy if exists "duos_select" on public.duos;
create policy "duos_select" on public.duos
  for select using (auth.uid() = a or auth.uid() = b);
drop policy if exists "duos_insert" on public.duos;
create policy "duos_insert" on public.duos
  for insert with check (auth.uid() = a and b is null);
drop policy if exists "duos_delete" on public.duos;
create policy "duos_delete" on public.duos
  for delete using (auth.uid() = a or auth.uid() = b);

-- Rejoindre : le code n'est pas lisible par qui ne fait pas partie du duo,
-- la jonction passe donc par une fonction qui court-circuite la RLS.
create or replace function public.join_duo(p_code text, p_name text)
returns public.duos
language plpgsql security definer set search_path = public as $$
declare d public.duos;
begin
  update public.duos
     set b = auth.uid(), b_name = p_name
   where code = upper(trim(p_code)) and b is null and a <> auth.uid()
  returning * into d;
  if d.id is null then
    raise exception 'code_invalide';
  end if;
  -- Un seul duo à la fois : les anciens liens de ces deux comptes tombent
  delete from public.duos
   where id <> d.id
     and (a in (d.a, d.b) or b in (d.a, d.b));
  return d;
end $$;
revoke all on function public.join_duo(text, text) from public;
grant execute on function public.join_duo(text, text) to authenticated;

create or replace function public.is_duo_member(p_duo uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.duos where id = p_duo and (auth.uid() = a or auth.uid() = b)
  );
$$;
grant execute on function public.is_duo_member(uuid) to authenticated;

-- ── Séance en direct : une ligne par personne, écrasée à chaque série ────────
create table if not exists public.duo_live (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  duo_id uuid not null references public.duos on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.duo_live enable row level security;

drop policy if exists "duo_live_select" on public.duo_live;
create policy "duo_live_select" on public.duo_live
  for select using (public.is_duo_member(duo_id));
drop policy if exists "duo_live_insert" on public.duo_live;
create policy "duo_live_insert" on public.duo_live
  for insert with check (user_id = auth.uid() and public.is_duo_member(duo_id));
drop policy if exists "duo_live_update" on public.duo_live;
create policy "duo_live_update" on public.duo_live
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_duo_member(duo_id));

-- ── Mots d'encouragement ─────────────────────────────────────────────────────
-- `unlock` : moment de la séance du destinataire où le mot se révèle
-- ('now', 'start', 'first_set', 'half', 'last', 'pr', 'finish').
create table if not exists public.duo_cheers (
  id uuid primary key default gen_random_uuid(),
  duo_id uuid not null references public.duos on delete cascade,
  from_user uuid not null default auth.uid() references auth.users on delete cascade,
  text text not null check (char_length(text) between 1 and 280),
  unlock text not null default 'now',
  created_at timestamptz not null default now(),
  revealed_at timestamptz
);
alter table public.duo_cheers enable row level security;

drop policy if exists "duo_cheers_select" on public.duo_cheers;
create policy "duo_cheers_select" on public.duo_cheers
  for select using (public.is_duo_member(duo_id));
drop policy if exists "duo_cheers_insert" on public.duo_cheers;
create policy "duo_cheers_insert" on public.duo_cheers
  for insert with check (from_user = auth.uid() and public.is_duo_member(duo_id));
-- Le destinataire marque le mot comme révélé
drop policy if exists "duo_cheers_update" on public.duo_cheers;
create policy "duo_cheers_update" on public.duo_cheers
  for update using (from_user <> auth.uid() and public.is_duo_member(duo_id));
drop policy if exists "duo_cheers_delete" on public.duo_cheers;
create policy "duo_cheers_delete" on public.duo_cheers
  for delete using (from_user = auth.uid());

-- ── Temps réel ───────────────────────────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.duo_live;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.duo_cheers;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.duos;
  exception when duplicate_object then null;
  end;
end $$;
