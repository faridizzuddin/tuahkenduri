create table public.betik_game (
  id smallint primary key default 1 check (id = 1),
  actual_seed_count integer check (actual_seed_count between 1 and 1000000),
  revealed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint revealed_state_is_complete check (
    (actual_seed_count is null and revealed_at is null)
    or (actual_seed_count is not null and revealed_at is not null)
  )
);

insert into public.betik_game(id) values (1);

create table public.betik_guesses (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null check (length(btrim(participant_name)) between 1 and 120),
  entry_reference text check (entry_reference is null or length(btrim(entry_reference)) between 1 and 60),
  guessed_count integer not null check (guessed_count between 1 and 1000000),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index betik_guesses_created_at_idx on public.betik_guesses(created_at desc);
create index betik_guesses_count_idx on public.betik_guesses(guessed_count);

create trigger betik_game_updated_at before update on public.betik_game
for each row execute function public.set_updated_at();
create trigger betik_guesses_updated_at before update on public.betik_guesses
for each row execute function public.set_updated_at();

alter table public.betik_game enable row level security;
alter table public.betik_guesses enable row level security;

create policy "authenticated hosts read betik game" on public.betik_game
  for select to authenticated using (true);

create policy "authenticated hosts read betik guesses" on public.betik_guesses
  for select to authenticated using (true);
create policy "authenticated hosts insert betik guesses" on public.betik_guesses
  for insert to authenticated with check (true);
create policy "authenticated hosts update betik guesses" on public.betik_guesses
  for update to authenticated using (true) with check (true);
create policy "authenticated hosts delete betik guesses" on public.betik_guesses
  for delete to authenticated using (true);

revoke all on public.betik_game from anon, authenticated;
grant select on public.betik_game to authenticated;

create or replace function public.require_betik_game_open()
returns trigger language plpgsql security definer set search_path = '' as $$
declare answer integer;
begin
  perform public.require_authenticated();
  select actual_seed_count into answer from public.betik_game where id = 1 for key share;
  if answer is not null then
    raise exception 'Penyertaan telah ditutup. Buka semula permainan untuk mengubah rekod.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger betik_guesses_only_while_open
before insert or update or delete on public.betik_guesses
for each row execute function public.require_betik_game_open();

create or replace function public.reveal_betik_answer(p_actual_seed_count integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_authenticated();
  if p_actual_seed_count is null or p_actual_seed_count < 1 or p_actual_seed_count > 1000000 then
    raise exception 'Jumlah sebenar mestilah antara 1 hingga 1,000,000';
  end if;

  perform 1 from public.betik_game where id = 1 for update;
  if not exists (select 1 from public.betik_guesses) then
    raise exception 'Belum ada penyertaan untuk dikira';
  end if;

  update public.betik_game
  set actual_seed_count = p_actual_seed_count, revealed_at = now()
  where id = 1 and actual_seed_count is null;
  if not found then raise exception 'Keputusan telah diumumkan'; end if;
end;
$$;

create or replace function public.reopen_betik_game()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_authenticated();
  update public.betik_game
  set actual_seed_count = null, revealed_at = null
  where id = 1;
end;
$$;

revoke all on function public.require_betik_game_open() from public, anon;
revoke all on function public.reveal_betik_answer(integer) from public, anon;
revoke all on function public.reopen_betik_game() from public, anon;
grant execute on function public.reveal_betik_answer(integer) to authenticated;
grant execute on function public.reopen_betik_game() to authenticated;
